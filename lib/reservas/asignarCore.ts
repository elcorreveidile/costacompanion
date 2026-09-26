import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { acompanantes, profiles, reservas, tiposGestion } from "@/lib/db/schema";
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
import {
  emailNuevaReserva,
  emailPeticionAsignada,
} from "@/lib/email";
import { enviarPushAPerfil } from "@/lib/push/send";
import { pushStrings } from "@/lib/push/strings";
import { isLocale } from "@/lib/i18n/config";

/**
 * Núcleo común de asignación de la cola de gestiones (C1/C1.5).
 *
 * SIN "use server": módulo interno compartido por la acción del superadmin
 * (asignaciones.ts) y el autoservicio del acompañante (cola.ts). No expone
 * endpoints; devuelve resultados y NUNCA lanza redirect (así ningún
 * try/catch aguas abajo se traga un NEXT_REDIRECT).
 *
 * Neon HTTP sin transacciones ⇒ toda mutación es un UPDATE condicional
 * (0 filas ⇒ otra request ganó, salir en silencio).
 */

export type MotivoAsignar = "cola_perdida" | "candidato_invalido" | "precio";

export type ResultadoAsignar = { ok: true } | { ok: false; motivo: MotivoAsignar };

/**
 * Asigna un acompañante a una petición en cola: recalcular precio con su
 * zona base, snapshot y UPDATE condicional (claim). Idempotente: si la fila
 * dejó de estar en cola, devuelve `cola_perdida` sin tocar nada.
 */
export async function asignarReservaACandidato(opts: {
  reservaId: string;
  acompananteId: string;
}): Promise<ResultadoAsignar> {
  const { reservaId, acompananteId: asignadoId } = opts;

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
  if (!reserva || !reserva.modoGestion) return { ok: false, motivo: "cola_perdida" };

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
    return { ok: false, motivo: "candidato_invalido" };
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
    if (!(e instanceof PrecioError)) {
      console.error("asignarReservaACandidato (precio):", e);
    }
    return { ok: false, motivo: "precio" };
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
  if (actualizadas.length === 0) return { ok: false, motivo: "cola_perdida" };

  await notificarAsignacion({
    reservaId,
    clienteId: reserva.clienteId,
    clienteNombre: reserva.clienteNombre ?? "Cliente",
    clienteEmail: reserva.clienteEmail,
    clienteIdioma: reserva.clienteIdioma,
    acompId: acomp.id,
    acompProfileId: acomp.profileId,
    acompNombre: acomp.nombrePublico,
    acompEmail: acomp.emailContacto,
    acompIdioma: acomp.idioma,
    tipoGestionKey: reserva.tipoGestionKey,
    fechaHora: reserva.fechaHora,
    totalCents,
  });

  return { ok: true };
}

// ── Notificación común a asignar/reasignar ───────────────────────────────────

export async function notificarAsignacion(a: {
  reservaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string | null;
  clienteIdioma: string | null;
  acompId: string;
  acompProfileId: string;
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

  // Al acompañante asignado: mismo aviso que una reserva directa (push).
  const pa = pushStrings[isLocale(a.acompIdioma) ? a.acompIdioma : "es"];
  enviarPushAPerfil(a.acompProfileId, {
    title: pa.nuevaReservaTitle,
    body: pa.nuevaReservaBody({ clienteNombre: a.clienteNombre, fechaStr }),
    url: "/acompanante/reservas",
    tag: `reserva-${a.reservaId}`,
  }).catch((e) => console.error("push asignación (acompañante):", e));
}
