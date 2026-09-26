import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tarifas, zonas, configPrecios, acompanantes } from "@/lib/db/schema";
import { horasHasta } from "@/lib/tiempo";

/**
 * Cálculo de precios de gestiones — tarjeta de la PLATAFORMA por MODO.
 *
 * Reglas (decisión de producto, no negociable en el cliente):
 *  - Remota (videollamada, ≤45 min): precio fijo de la tarifa 'remota'.
 *  - Presencial por hora: mínimo facturable aplicado (config), tarifa 'hora'.
 *  - Media jornada / jornada: precio fijo (la duración es definición de producto).
 *  - Zona: municipio base del acompañante sin recargo; resto según tabla `zonas`.
 *  - Urgencia (cita a menos de `urgencia_horas_limite`): +% sobre base + zona.
 *  - Todo en CÉNTIMOS (enteros); redondeo solo al final. Nunca floats.
 *
 * El cliente NUNCA envía importes: la entrada es estructura (modo/zona/fecha),
 * el importe sale solo del servidor.
 */

export type ModoGestion = "remota" | "horas" | "media_jornada" | "jornada";

export interface TarifasCtx {
  tarifas: Record<string, number>; // key → importeCents
  zonas: Record<string, number>; // key → recargoCents
  config: Record<string, number>; // clave → valor
}

export interface EntradaPrecio {
  modo: ModoGestion;
  /** Solo modo "horas". Se aplica el mínimo facturable. */
  horas?: number;
  /** key de la tabla `zonas`; null en modo remota. */
  zonaKey: string | null;
  /** key del municipio base del acompañante; null ⇒ recargo en todas. */
  zonaBaseAcompanante: string | null;
  fechaHora: Date;
  ahora: Date;
}

export interface LineaPrecio {
  key: "base" | "zona" | "urgencia";
  importeCents: number;
}

export interface DesglosePrecio {
  lineas: LineaPrecio[];
  baseCents: number;
  recargoZonaCents: number;
  recargoUrgenciaCents: number;
  totalCents: number;
  urgencia: boolean;
  /** Mínimo de horas aplicado en modo "horas" (info para el desglose). */
  horasFacturadas: number | null;
}

export type CodigoErrorPrecio =
  | "modo_invalido"
  | "zona_fuera_provincia"
  | "horas_invalidas"
  | "tarifa_no_configurada";

export class PrecioError extends Error {
  codigo: CodigoErrorPrecio;
  constructor(codigo: CodigoErrorPrecio) {
    super(codigo);
    this.codigo = codigo;
  }
}

export function calcularPrecio(entrada: EntradaPrecio, ctx: TarifasCtx): DesglosePrecio {
  const {
    modo,
    horas,
    zonaKey,
    zonaBaseAcompanante,
    fechaHora,
    ahora,
  } = entrada;

  const config = ctx.config;
  const minHoras = config.min_horas_facturables ?? 2;

  // ── Base según modo ──
  let baseCents: number;
  let horasFacturadas: number | null = null;

  switch (modo) {
    case "remota": {
      baseCents = ctx.tarifas["remota"];
      break;
    }
    case "horas": {
      if (!horas || horas <= 0 || !Number.isInteger(horas)) {
        throw new PrecioError("horas_invalidas");
      }
      horasFacturadas = Math.max(horas, minHoras);
      const tarifaHora = ctx.tarifas["hora"];
      if (!tarifaHora) throw new PrecioError("tarifa_no_configurada");
      baseCents = horasFacturadas * tarifaHora;
      break;
    }
    case "media_jornada":
      baseCents = ctx.tarifas["media_jornada"];
      break;
    case "jornada":
      baseCents = ctx.tarifas["jornada"];
      break;
    default:
      throw new PrecioError("modo_invalido");
  }
  if (!baseCents) throw new PrecioError("tarifa_no_configurada");

  // ── Recargo de zona ──
  let recargoZonaCents = 0;
  if (modo !== "remota") {
    if (!zonaKey) throw new PrecioError("zona_fuera_provincia");
    if (zonaKey !== zonaBaseAcompanante) {
      const recargo = ctx.zonas[zonaKey];
      if (recargo === undefined) throw new PrecioError("zona_fuera_provincia");
      recargoZonaCents = recargo;
    }
  }

  // ── Urgencia (instantes UTC ⇒ DST-safe) ──
  const limiteHoras = config.urgencia_horas_limite ?? 48;
  const pctUrgencia = config.urgencia_pct ?? 50;
  const urgencia = horasHasta(ahora, fechaHora) < limiteHoras;
  const recargoUrgenciaCents = urgencia
    ? Math.round(((baseCents + recargoZonaCents) * pctUrgencia) / 100)
    : 0;

  const totalCents = baseCents + recargoZonaCents + recargoUrgenciaCents;

  const lineas: LineaPrecio[] = [{ key: "base", importeCents: baseCents }];
  if (recargoZonaCents > 0) lineas.push({ key: "zona", importeCents: recargoZonaCents });
  if (recargoUrgenciaCents > 0)
    lineas.push({ key: "urgencia", importeCents: recargoUrgenciaCents });

  return {
    lineas,
    baseCents,
    recargoZonaCents,
    recargoUrgenciaCents,
    totalCents,
    urgencia,
    horasFacturadas,
  };
}

/**
 * Carga el contexto de tarifas desde la BD (sin caché: los importes se tunenan
 * desde /admin/tarifas y deben aplicarse al momento).
 */
export async function cargarContextoPrecios(): Promise<TarifasCtx> {
  const [tarifasRows, zonasRows, configRows] = await Promise.all([
    db.select().from(tarifas).where(eq(tarifas.activo, true)),
    db.select().from(zonas).where(eq(zonas.activo, true)),
    db.select().from(configPrecios),
  ]);

  const ctx: TarifasCtx = { tarifas: {}, zonas: {}, config: {} };
  for (const t of tarifasRows) ctx.tarifas[t.key] = t.importeCents;
  for (const z of zonasRows) ctx.zonas[z.key] = z.recargoCents;
  for (const c of configRows) ctx.config[c.clave] = c.valorEntero;
  return ctx;
}

/** Carga zona base del acompañante (key de `zonas` o null). */
export async function getZonaBaseAcompanante(
  acompananteId: string
): Promise<string | null> {
  const [row] = await db
    .select({ zonaBase: acompanantes.zonaBase })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);
  return row?.zonaBase ?? null;
}

/** Formatea céntimos como euros con Intl (para desgloses y paneles). */
export function formatEuros(cents: number, locale = "es-ES"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
