import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resenas, acompanantes } from "@/lib/db/schema";

/**
 * Recalcula valoracion_media y num_resenas del acompañante a partir de sus
 * reseñas aprobadas. Sustituye al trigger de Postgres (trg_resena_cambio) que
 * existía en Supabase y no se portó a Neon.
 */
export async function recalcularValoracion(acompananteId: string): Promise<void> {
  const rows = await db
    .select({ puntuacion: resenas.puntuacion })
    .from(resenas)
    .where(and(eq(resenas.acompananteId, acompananteId), eq(resenas.aprobada, true)));

  const count = rows.length;
  const media = count
    ? rows.reduce((s, r) => s + r.puntuacion, 0) / count
    : null;

  await db
    .update(acompanantes)
    .set({
      numResenas: count,
      valoracionMedia: media === null ? null : media.toFixed(2),
    })
    .where(eq(acompanantes.id, acompananteId));
}
