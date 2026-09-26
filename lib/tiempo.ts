import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Utilidades de tiempo para la zona horaria del servicio (Europe/Madrid).
 *
 * Reglas del proyecto:
 *  - En la BD todo se guarda como `timestamptz` (instantes UTC).
 *  - La ÚNICA conversión pared→instante es `fromZonedTime` (input del
 *    formulario y extremos del día natural en la agenda).
 *  - Todos los plazos (urgencia < 48 h, cancelación 48/24 h, recordatorio
 *    24 h) se comparan como instantes UTC ⇒ inmunes a cambios de hora (DST).
 *  - Para mostrar fechas/horas al usuario se formatea en Madrid (Intl o los
 *    helpers de abajo).
 */

export const TZ_MADRID = "Europe/Madrid";

/** Convierte hora «de pared» de Madrid (`2026-03-14`, `10:30`) al instante UTC. */
export function madridWallTimeToUtc(fechaISO: string, horaHHMM: string): Date {
  return fromZonedTime(`${fechaISO}T${horaHHMM}:00`, TZ_MADRID);
}

/** Extremos (instantes UTC) del día natural `fechaISO` según calendario de Madrid. */
export function limitesDiaMadrid(fechaISO: string): { desde: Date; hasta: Date } {
  const desde = fromZonedTime(`${fechaISO}T00:00:00`, TZ_MADRID);
  const diaSiguienteISO = format(addDays(parseISO(fechaISO), 1), "yyyy-MM-dd");
  const hasta = fromZonedTime(`${diaSiguienteISO}T00:00:00`, TZ_MADRID);
  return { desde, hasta };
}

/** Fecha ISO (`yyyy-MM-dd`) a la que pertenece un instante según Madrid. */
export function fechaISOenMadrid(instante: Date): string {
  return format(toZonedTime(instante, TZ_MADRID), "yyyy-MM-dd");
}

/** Hora `HH:mm` de un instante según Madrid (para agenda y displays). */
export function horaMadrid(instante: Date): string {
  return format(toZonedTime(instante, TZ_MADRID), "HH:mm");
}

/** Fecha y hora legibles en Madrid, p. ej. «14/03/2026, 10:30». */
export function fechaHoraMadrid(instante: Date, locale = "es-ES"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ_MADRID,
  }).format(instante);
}

/** Diferencia en horas (decimal) entre dos instantes. */
export function horasHasta(desde: Date, hasta: Date): number {
  return (hasta.getTime() - desde.getTime()) / 3_600_000;
}
