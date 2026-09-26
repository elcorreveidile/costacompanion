"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes,
  profiles,
  reservas,
  tiposGestion,
  zonas as tZonas,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { locales, type Locale } from "@/lib/i18n/config";
import {
  cargarContextoPrecios,
  calcularPrecio,
  getZonaBaseAcompanante,
  PrecioError,
  type DesglosePrecio,
  type ModoGestion,
} from "@/lib/precios";
import { emailNuevaReserva } from "@/lib/email";

/**
 * Reserva de GESTIONES con la tarjeta de precios de la plataforma.
 *
 * El cliente NUNCA envía importes: la entrada es estructura
 * (modo / zona / fecha / horas) y el importe se calcula solo en el servidor,
 * dos veces (preview en el form + recálculo íntegro al crear).
 */

const MODOS_VALIDOS: readonly ModoGestion[] = [
  "remota",
  "horas",
  "media_jornada",
  "jornada",
];

const DETALLE_MAX = 2000;

function esModoGestion(v: unknown): v is ModoGestion {
  return typeof v === "string" && (MODOS_VALIDOS as readonly string[]).includes(v);
}

function modalidadDeReserva(modo: ModoGestion): "presencial" | "remoto" {
  return modo === "remota" ? "remoto" : "presencial";
}

async function getAcompananteReserva(acompananteId: string) {
  const [row] = await db
    .select({
      id: acompanantes.id,
      slug: acompanantes.slug,
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      modalidades: acompanantes.modalidades,
      activo: acompanantes.activo,
      aceptaGestiones: acompanantes.aceptaGestiones,
      idioma: profiles.idiomaPreferido,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);
  return row ?? null;
}

/** La acompañante ofrece la modalidad que exige el modo elegido. */
function modalidadCompatible(
  modalidades: ("presencial" | "remoto" | "ambos")[] | null,
  modo: ModoGestion
): boolean {
  if (!modalidades || modalidades.length === 0) return true; // sin restricción declarada
  if (modo === "remota") {
    return modalidades.includes("remoto") || modalidades.includes("ambos");
  }
  return modalidades.includes("presencial") || modalidades.includes("ambos");
}

// ── Preview de precio (debounce del formulario) ──────────────────────────────

export type CodigoErrorPreview =
  | "acompanante_invalido"
  | "fecha_invalida"
  | "modo_invalido"
  | "zona_fuera_provincia"
  | "horas_invalidas"
  | "tarifa_no_configurada";

export type ResultadoPreview =
  | { ok: true; desglose: DesglosePrecio; zonaBase: string | null }
  | { ok: false; codigo: CodigoErrorPreview };

export interface EntradaPreview {
  acompananteId: string;
  modo: ModoGestion;
  horas?: number;
  zonaKey: string | null;
  fechaHoraISO: string;
}

export async function previewPrecioGestion(
  entrada: EntradaPreview
): Promise<ResultadoPreview> {
  if (!esModoGestion(entrada.modo)) return { ok: false, codigo: "modo_invalido" };

  const acomp = await getAcompananteReserva(entrada.acompananteId);
  if (!acomp || !acomp.activo || !acomp.aceptaGestiones) {
    return { ok: false, codigo: "acompanante_invalido" };
  }
  if (!modalidadCompatible(acomp.modalidades, entrada.modo)) {
    return { ok: false, codigo: "modo_invalido" };
  }

  const fechaHora = new Date(entrada.fechaHoraISO);
  if (Number.isNaN(fechaHora.getTime()) || fechaHora.getTime() <= Date.now()) {
    return { ok: false, codigo: "fecha_invalida" };
  }

  try {
    const [ctx, zonaBase] = await Promise.all([
      cargarContextoPrecios(),
      getZonaBaseAcompanante(entrada.acompananteId),
    ]);
    const desglose = calcularPrecio(
      {
        modo: entrada.modo,
        horas: entrada.horas,
        zonaKey: entrada.zonaKey,
        zonaBaseAcompanante: zonaBase,
        fechaHora,
        ahora: new Date(),
      },
      ctx
    );
    return { ok: true, desglose, zonaBase };
  } catch (e) {
    if (e instanceof PrecioError) return { ok: false, codigo: e.codigo };
    console.error("previewPrecioGestion:", e);
    return { ok: false, codigo: "tarifa_no_configurada" };
  }
}

// ── Creación de la reserva ───────────────────────────────────────────────────

export async function crearReservaGestion(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const acompananteId = formData.get("acompanante_id") as string;
  const modo = formData.get("modo");
  const modoGestion = esModoGestion(modo) ? modo : null;
  if (!modoGestion) redirect(`/cliente/reservas`);

  const acomp = await getAcompananteReserva(acompananteId);
  const volver = `/${acomp?.slug ?? ""}/reservar`;
  if (!acomp || !acomp.activo || !acomp.aceptaGestiones) {
    redirect(volver);
  }
  if (!modalidadCompatible(acomp.modalidades, modoGestion)) {
    redirect(volver);
  }

  const fechaHora = new Date(formData.get("fecha_hora") as string);
  if (Number.isNaN(fechaHora.getTime()) || fechaHora.getTime() <= Date.now()) {
    redirect(volver);
  }

  // Estructura opcional
  const horasRaw = formData.get("horas");
  const horas = horasRaw ? Number(horasRaw) : undefined;
  const zonaKey = ((formData.get("zona_key") as string | null) || "") || null;
  const detalleServicio =
    ((formData.get("detalle_servicio") as string | null) || "").trim().slice(0, DETALLE_MAX) ||
    null;

  // tipo_gestion_key: validar contra el catálogo activo
  let tipoGestionKey: string | null =
    ((formData.get("tipo_gestion_key") as string | null) || "") || null;
  if (tipoGestionKey) {
    const [tg] = await db
      .select({ key: tiposGestion.key })
      .from(tiposGestion)
      .where(
        and(eq(tiposGestion.key, tipoGestionKey), eq(tiposGestion.activo, true))
      )
      .limit(1);
    if (!tg) tipoGestionKey = null;
  }

  // idioma_gestion: uno de los 7 idiomas de la plataforma
  const idiomaRaw = (formData.get("idioma_gestion") as string | null) || "";
  const idiomaGestion: string | null = (locales as readonly string[]).includes(idiomaRaw)
    ? (idiomaRaw as Locale)
    : null;

  // Método de pago: remota ⇒ siempre tarjeta; efectivo solo presencial ∧ no bloqueado
  const [profile] = await db
    .select({ efectivoBloqueado: profiles.efectivoBloqueado })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  const efectivoPosible =
    modoGestion !== "remota" && !(profile?.efectivoBloqueado ?? false);
  const metodoPago =
    formData.get("metodo_pago") === "efectivo" && efectivoPosible
      ? "efectivo"
      : "tarjeta";

  // ── Recálculo íntegro en el servidor (snapshot inmutable) ──
  const [ctx, zonaBase] = await Promise.all([
    cargarContextoPrecios(),
    getZonaBaseAcompanante(acompananteId),
  ]);

  let desglose: DesglosePrecio;
  try {
    desglose = calcularPrecio(
      {
        modo: modoGestion,
        horas: modoGestion === "horas" ? horas : undefined,
        zonaKey: modoGestion === "remota" ? null : zonaKey,
        zonaBaseAcompanante: zonaBase,
        fechaHora,
        ahora: new Date(),
      },
      ctx
    );
  } catch (e) {
    if (e instanceof PrecioError) redirect(volver);
    console.error("crearReservaGestion (precio):", e);
    redirect(volver);
  }

  const estadoPago = metodoPago === "tarjeta" ? "pendiente_pago" : "pendiente_cobro";

  // INSERT antes de cobrar (Neon HTTP sin transacciones). El pago (Etapa 2)
  // parte de esta fila; `estadoPago='pendiente_pago'` en el WHERE condicional
  // hace idempotente todo el ciclo posterior.
  const [reserva] = await db
    .insert(reservas)
    .values({
      acompananteId,
      clienteId: user.id,
      disponibilidadId: null,
      fechaHora,
      modalidad: modalidadDeReserva(modoGestion),
      zona: modoGestion === "remota" ? null : zonaKey,
      detalleServicio,
      estado: "pendiente",
      tipoReserva: "gestion",
      modoGestion,
      tipoGestionKey,
      idiomaGestion,
      metodoPago,
      estadoPago,
      precioTotalCents: desglose.totalCents,
      precioDesglose: desglose,
      moneda: "eur",
    })
    .returning({ id: reservas.id });

  // Notificar al acompañante (fire-and-forget; sin datos sensibles)
  if (acomp.emailContacto) {
    let tipoNombre: string | undefined;
    if (tipoGestionKey) {
      const [tg] = await db
        .select({ nombre: tiposGestion.nombre })
        .from(tiposGestion)
        .where(eq(tiposGestion.key, tipoGestionKey))
        .limit(1);
      tipoNombre = (tg?.nombre as { es?: string } | undefined)?.es;
    }
    const [cliente] = await db
      .select({ nombre: profiles.nombre })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    emailNuevaReserva({
      toEmail: acomp.emailContacto,
      clienteNombre: cliente?.nombre ?? user.email ?? "Un cliente",
      acompananteNombre: acomp.nombrePublico,
      fechaStr: fechaHora.toLocaleString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      servicioNombre: tipoNombre,
      idioma: acomp.idioma ?? undefined,
    });
  }

  revalidatePath("/cliente/reservas");
  revalidatePath("/acompanante/reservas");
  redirect("/cliente/reservas");
}

// ── Datos para el formulario (catálogo) ──────────────────────────────────────

/** Zonas activas de booking (para el select del form). Solo lectura. */
export async function getZonasBooking() {
  return db
    .select({ key: tZonas.key, nombre: tZonas.nombre })
    .from(tZonas)
    .where(eq(tZonas.activo, true));
}
