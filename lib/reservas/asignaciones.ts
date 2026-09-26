"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { acompanantes, profiles, reservas, tiposGestion } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import {
  cargarContextoPrecios,
  calcularPrecio,
  getZonaBaseAcompanante,
  modalidadCompatible,
  PrecioError,
  formatEuros,
  type ModoGestion,
} from "@/lib/precios";
import { fechaHoraMadrid } from "@/lib/tiempo";
import { getStripe } from "@/lib/stripe";
import {
  emailNuevaReserva,
  emailPeticionAsignada,
  emailReservaCancelada,
} from "@/lib/email";
import { enviarPushAPerfil } from "@/lib/push/send";
import { pushStrings } from "@/lib/push/strings";
import { isLocale } from "@/lib/i18n/config";

/**
 * Cola de asignación manual (Fase C1).
 *
 * El cliente pide una gestión SIN elegir acompañante (precio null en cola).
 * El superadmin asigna: aquí se recalcula TODO el precio en servidor con la
 * zona base del asignado, se hace snapshot y se notifica al cliente para pagar.
 * Neon HTTP sin transacciones ⇒ toda mutación es un UPDATE condicional
 * (0 filas ⇒ otra request ganó, salir en silencio).
 */

async function esSuperadmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.rol === "superadmin";
}

/** Vuelve al panel con un error visible (patrón ?doc_error de documentos). */
function volverConError(): never {
  redirect("/admin/reservas?error_asignacion=1");
}

// ── Lecturas para el panel ───────────────────────────────────────────────────

/** Peticiones en cola: gestion, pendiente, sin acompañante. Más antiguas primero. */
export async function listarColaAsignacion() {
  return db
    .select({
      id: reservas.id,
      fechaHora: reservas.fechaHora,
      modalidad: reservas.modalidad,
      modoGestion: reservas.modoGestion,
      horas: reservas.horas,
      tipoGestionKey: reservas.tipoGestionKey,
      idiomaGestion: reservas.idiomaGestion,
      zona: reservas.zona,
      detalleServicio: reservas.detalleServicio,
      metodoPago: reservas.metodoPago,
      createdAt: reservas.createdAt,
      clienteNombre: profiles.nombre,
      clienteEmail: profiles.email,
      clienteIdioma: profiles.idiomaPreferido,
    })
    .from(reservas)
    .leftJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(
      and(
        isNull(reservas.acompananteId),
        eq(reservas.tipoReserva, "gestion"),
        eq(reservas.estado, "pendiente")
      )
    )
    .orderBy(asc(reservas.createdAt))
    .limit(50);
}

/** Candidatos para asignar: activos y que acepten gestiones. */
export async function listarCandidatos() {
  return db
    .select({
      id: acompanantes.id,
      nombrePublico: acompanantes.nombrePublico,
      zonaBase: acompanantes.zonaBase,
      idiomas: acompanantes.idiomas,
      modalidades: acompanantes.modalidades,
      valoracionMedia: acompanantes.valoracionMedia,
      numResenas: acompanantes.numResenas,
      destacado: acompanantes.destacado,
    })
    .from(acompanantes)
    .where(
      and(eq(acompanantes.activo, true), eq(acompanantes.aceptaGestiones, true))
    )
    .orderBy(asc(acompanantes.nombrePublico));
}

// ── Mutaciones ───────────────────────────────────────────────────────────────

/**
 * Asigna un acompañante a una petición de la cola. Fija precio (recalculado
 * con la zona base del asignado), `asignadoAt` y notifica a ambos.
 */
export async function asignarReserva(formData: FormData): Promise<void> {
  if (!(await esSuperadmin())) return;

  const reservaId = formData.get("reserva_id") as string;
  const asignadoId = formData.get("acompanante_id") as string;
  if (!reservaId || !asignadoId) return;

  // La fila debe seguir en cola (idempotencia sin transacciones).
  const [reserva] = await db
    .select({
      id: reservas.id,
      clienteId: reservas.clienteId,
      fechaHora: reservas.fechaHora,
      modoGestion: reservas.modoGestion,
      horas: reservas.horas,
      tipoGestionKey: reservas.tipoGestionKey,
      zona: reservas.zona,
      metodoPago: reservas.metodoPago,
      estadoPago: reservas.estadoPago,
      clienteNombre: profiles.nombre,
      clienteEmail: profiles.email,
      clienteIdioma: profiles.idiomaPreferido,
    })
    .from(reservas)
    .leftJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(
      and(
        eq(reservas.id, reservaId),
        isNull(reservas.acompananteId),
        eq(reservas.tipoReserva, "gestion"),
        eq(reservas.estado, "pendiente")
      )
    )
    .limit(1);
  if (!reserva || !reserva.modoGestion) return;

  // Candidato válido: activo ∧ acepta gestiones ∧ modalidad compatible.
  const [acomp] = await db
    .select({
      id: acompanantes.id,
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      modalidades: acompanantes.modalidades,
      profileId: acompanantes.profileId,
      idioma: profiles.idiomaPreferido,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(
      and(
        eq(acompanantes.id, asignadoId),
        eq(acompanantes.activo, true),
        eq(acompanantes.aceptaGestiones, true)
      )
    )
    .limit(1);
  if (!acomp || !modalidadCompatible(acomp.modalidades, reserva.modoGestion)) {
    volverConError();
  }

  // Precio exacto con la zona base del asignado (snapshot inmutable).
  let totalCents: number;
  let desglose: object;
  try {
    const [ctx, zonaBase] = await Promise.all([
      cargarContextoPrecios(),
      getZonaBaseAcompanante(asignadoId),
    ]);
    const d = calcularPrecio(
      {
        modo: reserva.modoGestion as ModoGestion,
        horas: reserva.modoGestion === "horas" ? (reserva.horas ?? undefined) : undefined,
        zonaKey: reserva.modoGestion === "remota" ? null : reserva.zona,
        zonaBaseAcompanante: zonaBase,
        fechaHora: reserva.fechaHora,
        ahora: new Date(),
      },
      ctx
    );
    totalCents = d.totalCents;
    desglose = d;
  } catch (e) {
    if (e instanceof PrecioError) volverConError();
    console.error("asignarReserva (precio):", e);
    volverConError();
  }

  // UPDATE condicional: solo gana una request (la fila sigue sin asignar).
  const actualizadas = await db
    .update(reservas)
    .set({
      acompananteId: asignadoId,
      precioTotalCents: totalCents,
      precioDesglose: desglose,
      asignadoAt: new Date(),
    })
    .where(
      and(
        eq(reservas.id, reservaId),
        isNull(reservas.acompananteId),
        eq(reservas.estado, "pendiente")
      )
    )
    .returning({ id: reservas.id });
  if (actualizadas.length === 0) return;

  await notificarAsignacion({
    reservaId,
    clienteId: reserva.clienteId,
    clienteNombre: reserva.clienteNombre ?? "Cliente",
    clienteEmail: reserva.clienteEmail,
    clienteIdioma: reserva.clienteIdioma,
    acompId: acomp.id,
    acompNombre: acomp.nombrePublico,
    acompEmail: acomp.emailContacto,
    acompIdioma: acomp.idioma,
    tipoGestionKey: reserva.tipoGestionKey,
    fechaHora: reserva.fechaHora,
    totalCents,
  });

  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
  revalidatePath(`/cliente/reservas/${reservaId}`);
  revalidatePath("/acompanante/reservas");
}

/**
 * Reasignación pre-pago: solo `estado='pendiente'`, sin payment intent y con
 * pago aún no completado. Recalcula el precio con el nuevo asignado.
 */
export async function reasignarReserva(formData: FormData): Promise<void> {
  if (!(await esSuperadmin())) return;

  const reservaId = formData.get("reserva_id") as string;
  const nuevoId = formData.get("acompanante_id") as string;
  if (!reservaId || !nuevoId) return;

  const [reserva] = await db
    .select({
      id: reservas.id,
      clienteId: reservas.clienteId,
      acompananteId: reservas.acompananteId,
      fechaHora: reservas.fechaHora,
      modoGestion: reservas.modoGestion,
      horas: reservas.horas,
      tipoGestionKey: reservas.tipoGestionKey,
      zona: reservas.zona,
      estadoPago: reservas.estadoPago,
      paymentIntentId: reservas.stripePaymentIntentId,
      clienteNombre: profiles.nombre,
      clienteEmail: profiles.email,
      clienteIdioma: profiles.idiomaPreferido,
    })
    .from(reservas)
    .leftJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(eq(reservas.id, reservaId))
    .limit(1);

  // Pre-pago y con acompañante previo (la cola usa asignarReserva).
  if (
    !reserva ||
    !reserva.modoGestion ||
    !reserva.acompananteId ||
    (reserva.estadoPago !== "pendiente_pago" &&
      reserva.estadoPago !== "pendiente_cobro") ||
    reserva.paymentIntentId
  ) {
    return;
  }
  if (nuevoId === reserva.acompananteId) return;

  // Candidato válido (mismo criterio que asignar).
  const [acomp] = await db
    .select({
      id: acompanantes.id,
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      modalidades: acompanantes.modalidades,
      profileId: acompanantes.profileId,
      idioma: profiles.idiomaPreferido,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(
      and(
        eq(acompanantes.id, nuevoId),
        eq(acompanantes.activo, true),
        eq(acompanantes.aceptaGestiones, true)
      )
    )
    .limit(1);
  if (!acomp || !modalidadCompatible(acomp.modalidades, reserva.modoGestion)) {
    volverConError();
  }

  // Precio con la zona base del NUEVO asignado (p. ej. cambia el recargo).
  let totalCents: number;
  let desglose: object;
  try {
    const [ctx, zonaBase] = await Promise.all([
      cargarContextoPrecios(),
      getZonaBaseAcompanante(nuevoId),
    ]);
    const d = calcularPrecio(
      {
        modo: reserva.modoGestion as ModoGestion,
        horas: reserva.modoGestion === "horas" ? (reserva.horas ?? undefined) : undefined,
        zonaKey: reserva.modoGestion === "remota" ? null : reserva.zona,
        zonaBaseAcompanante: zonaBase,
        fechaHora: reserva.fechaHora,
        ahora: new Date(),
      },
      ctx
    );
    totalCents = d.totalCents;
    desglose = d;
  } catch (e) {
    if (e instanceof PrecioError) volverConError();
    console.error("reasignarReserva (precio):", e);
    volverConError();
  }

  const actualizadas = await db
    .update(reservas)
    .set({
      acompananteId: nuevoId,
      precioTotalCents: totalCents,
      precioDesglose: desglose,
      asignadoAt: new Date(),
    })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.estado, "pendiente"),
        isNull(reservas.stripePaymentIntentId),
        inArray(reservas.estadoPago, ["pendiente_pago", "pendiente_cobro"])
      )
    )
    .returning({ id: reservas.id });
  if (actualizadas.length === 0) return;

  await notificarAsignacion({
    reservaId,
    clienteId: reserva.clienteId,
    clienteNombre: reserva.clienteNombre ?? "Cliente",
    clienteEmail: reserva.clienteEmail,
    clienteIdioma: reserva.clienteIdioma,
    acompId: acomp.id,
    acompNombre: acomp.nombrePublico,
    acompEmail: acomp.emailContacto,
    acompIdioma: acomp.idioma,
    tipoGestionKey: reserva.tipoGestionKey,
    fechaHora: reserva.fechaHora,
    totalCents,
  });

  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
  revalidatePath(`/cliente/reservas/${reservaId}`);
  revalidatePath("/acompanante/reservas");
}

/**
 * Descarta una petición de la cola (superadmin): nada cobrado, sin reembolso.
 * El cliente recibe el email/push de cancelación con «Costa Companion».
 */
export async function descartarPeticion(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user || user.rol !== "superadmin") return;

  const reservaId = formData.get("reserva_id") as string;
  if (!reservaId) return;

  const [r] = await db
    .select({
      estado: reservas.estado,
      acompananteId: reservas.acompananteId,
      fechaHora: reservas.fechaHora,
      estadoPago: reservas.estadoPago,
      checkoutSessionId: reservas.stripeCheckoutSessionId,
      clienteId: reservas.clienteId,
      clienteIdioma: profiles.idiomaPreferido,
    })
    .from(reservas)
    .leftJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(eq(reservas.id, reservaId))
    .limit(1);

  // Solo peticiones en cola, pre-pago (en la cola nunca hay dinero movido).
  if (!r || r.estado !== "pendiente" || r.acompananteId !== null) return;

  const actualizadas = await db
    .update(reservas)
    .set({
      estado: "cancelada",
      estadoPago: "no_aplica",
      canceladaPor: "superadmin",
      canceladaMotivo: "descartada_admin",
      canceladaAt: new Date(),
    })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.estado, "pendiente"),
        isNull(reservas.acompananteId)
      )
    )
    .returning({ id: reservas.id });
  if (actualizadas.length === 0) return;

  // Defensivo: si hubiera una sesión de Checkout viva, fuera.
  if (r.estadoPago === "pendiente_pago" && r.checkoutSessionId) {
    await getStripe()
      .checkout.sessions.expire(r.checkoutSessionId)
      .catch(() => undefined);
  }

  // Aviso al cliente (email + push) con la marca de la plataforma.
  const fechaStr = fechaHoraMadrid(r.fechaHora);
  const p = pushStrings[isLocale(r.clienteIdioma) ? r.clienteIdioma : "es"];
  enviarPushAPerfil(r.clienteId, {
    title: p.canceladaTitle,
    body: p.canceladaBody({ acompananteNombre: "Costa Companion", fechaStr }),
    url: "/cliente/reservas",
    tag: `reserva-${reservaId}`,
  }).catch((e) => console.error("push descartar (cliente):", e));

  const [cliente] = await db
    .select({ email: profiles.email, nombre: profiles.nombre })
    .from(profiles)
    .where(eq(profiles.id, r.clienteId))
    .limit(1);
  if (cliente?.email) {
    emailReservaCancelada({
      toEmail: cliente.email,
      clienteNombre: cliente.nombre ?? "Cliente",
      acompananteNombre: "Costa Companion",
      fechaStr,
      idioma: r.clienteIdioma ?? undefined,
    });
  }

  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
}

// ── Notificación común a asignar/reasignar ───────────────────────────────────

async function notificarAsignacion(a: {
  reservaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string | null;
  clienteIdioma: string | null;
  acompId: string;
  acompNombre: string;
  acompEmail: string | null;
  acompIdioma: string | null;
  tipoGestionKey: string | null;
  fechaHora: Date;
  totalCents: number;
}) {
  const fechaStr = fechaHoraMadrid(a.fechaHora);

  // Al acompañante: mismo correo que una reserva directa (reutilización).
  if (a.acompEmail) {
    let tipoNombre: string | undefined;
    if (a.tipoGestionKey) {
      const [tg] = await db
        .select({ nombre: tiposGestion.nombre })
        .from(tiposGestion)
        .where(eq(tiposGestion.key, a.tipoGestionKey))
        .limit(1);
      tipoNombre = (tg?.nombre as { es?: string } | undefined)?.es;
    }
    emailNuevaReserva({
      toEmail: a.acompEmail,
      clienteNombre: a.clienteNombre,
      acompananteNombre: a.acompNombre,
      fechaStr,
      servicioNombre: tipoNombre,
      idioma: a.acompIdioma ?? undefined,
    });
  }

  // Al cliente: precio exacto + cómo pagar.
  if (a.clienteEmail) {
    emailPeticionAsignada({
      toEmail: a.clienteEmail,
      clienteNombre: a.clienteNombre,
      acompananteNombre: a.acompNombre,
      fechaStr,
      importeStr: formatEuros(a.totalCents),
      idioma: a.clienteIdioma ?? undefined,
    });
  }
  const p = pushStrings[isLocale(a.clienteIdioma) ? a.clienteIdioma : "es"];
  enviarPushAPerfil(a.clienteId, {
    title: p.asignadaTitle,
    body: p.asignadaBody({ acompananteNombre: a.acompNombre, fechaStr }),
    url: `/cliente/reservas/${a.reservaId}`,
    tag: `reserva-${a.reservaId}`,
  }).catch((e) => console.error("push asignación (cliente):", e));
}
