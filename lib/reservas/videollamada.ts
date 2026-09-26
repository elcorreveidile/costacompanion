import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservas } from "@/lib/db/schema";

/**
 * Videollamada de gestiones remotas.
 *  - Por defecto: sala Jitsi autogenerada con el uuid de la reserva
 *    (sin datos personales en la URL).
 *  - Override: el acompañante asignado (o un superadmin) puede guardar un
 *    enlace propio de Meet/Zoom (guardarEnlaceVideo en lib/reservas/actions.ts).
 *  - Ventana de acceso: fechaHora − 15 min … fechaHora + 2 h (helpers aquí).
 */

const JITSI_BASE = "https://meet.jit.si/costa-companion-";

/** Sala Jitsi determinista por reserva (el uuid ya es único y opaco). */
export function enlaceJitsi(reservaId: string): string {
  return `${JITSI_BASE}${reservaId}`;
}

/** Ventana en la que el botón «Unirse» es visible. */
export function videoEnVentana(fechaHora: Date, ahora = new Date()): boolean {
  const t = fechaHora.getTime();
  return ahora.getTime() >= t - 15 * 60 * 1000 && ahora.getTime() <= t + 2 * 60 * 60 * 1000;
}

/**
 * Al confirmarse una gestión remota sin enlace ⇒ Jitsi autogenerado.
 * UPDATE condicional: idempotente y nunca pisa un enlace manual.
 * Legacy (modoGestion null) y gestiones presenciales ⇒ 0 filas, no-op.
 */
export async function asignarEnlaceSiRemota(reservaId: string): Promise<void> {
  await db
    .update(reservas)
    .set({ enlaceVideo: enlaceJitsi(reservaId), enlaceVideoOrigen: "auto_jitsi" })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.modoGestion, "remota"),
        isNull(reservas.enlaceVideo)
      )
    );
}

/** Enlace manual válido = URL absoluta https. Devuelve true si es válido. */
export function validarEnlaceVideo(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}
