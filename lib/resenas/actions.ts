"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservas, resenas, acompanantes } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { recalcularValoracion } from "@/lib/resenas/helpers";

export async function crearResena(
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = (formData.get("reserva_id") as string | null)?.trim();
  const puntuacion = Number(formData.get("puntuacion"));
  const comentario = (formData.get("comentario") as string | null)?.trim() || null;

  if (!reservaId) return { error: "Accede desde Mis reservas." };
  if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
    return { error: "Puntuación inválida." };
  }

  // La reserva debe existir, ser del usuario y estar completada.
  const [reserva] = await db
    .select({ acompananteId: reservas.acompananteId, slug: acompanantes.slug })
    .from(reservas)
    .leftJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.clienteId, user.id),
        eq(reservas.estado, "completada")
      )
    )
    .limit(1);

  if (!reserva) {
    return { error: "No tienes una reserva completada que puedas reseñar." };
  }

  // No permitir dos reseñas para la misma reserva.
  const [existing] = await db
    .select({ id: resenas.id })
    .from(resenas)
    .where(eq(resenas.reservaId, reservaId))
    .limit(1);
  if (existing) {
    return { error: "Ya has dejado una reseña para esta reserva." };
  }

  try {
    await db.insert(resenas).values({
      acompananteId: reserva.acompananteId,
      clienteId: user.id,
      reservaId,
      puntuacion,
      comentario,
    });
  } catch (e) {
    console.error("crearResena:", e);
    return { error: "No se pudo guardar la reseña." };
  }

  // Actualiza la valoración media del acompañante (antes lo hacía un trigger).
  await recalcularValoracion(reserva.acompananteId);

  if (reserva.slug) revalidatePath(`/${reserva.slug}`);
  return {};
}
