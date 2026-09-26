"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservas } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getMiAcompananteId } from "@/lib/db/queries/acompanante";

/**
 * Acciones de agenda del acompañante (Etapa 7).
 * Neon HTTP sin transacciones ⇒ cada cierre es un UPDATE condicional por
 * estado: la condición ES la idempotencia (0 filas = ya aplicado o no aplica).
 * Superadmin puede actuar sobre cualquier reserva; acompañante solo las suyas.
 */

async function autorizacion(): Promise<{ userId: string; acompananteId: string | null; esSuperadmin: boolean }> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  const esSuperadmin = user.rol === "superadmin";
  const acompananteId = esSuperadmin ? null : await getMiAcompananteId(user.id);
  if (!esSuperadmin && !acompananteId) redirect("/acompanante");
  return { userId: user.id, acompananteId, esSuperadmin };
}

function filtroAsignacion(acompananteId: string | null, esSuperadmin: boolean) {
  return esSuperadmin ? undefined : eq(reservas.acompananteId, acompananteId!);
}

/**
 * Cobro en efectivo al cerrar la gestión presencial.
 * Solo: efectivo ∧ pendiente_cobro ∧ confirmada ∧ asignada ⇒ cobrada.
 */
export async function cobrarEfectivo(formData: FormData): Promise<void> {
  const { acompananteId, esSuperadmin } = await autorizacion();
  const reservaId = formData.get("reserva_id") as string;

  await db
    .update(reservas)
    .set({ estadoPago: "cobrada" })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.metodoPago, "efectivo"),
        eq(reservas.estadoPago, "pendiente_cobro"),
        eq(reservas.estado, "confirmada"),
        filtroAsignacion(acompananteId, esSuperadmin)
      )
    );

  revalidatePath("/acompanante/reservas");
}

/**
 * Cierre de la sesión ⇒ completada.
 * Exige el pago liquidado: pagada (tarjeta) ∨ cobrada (efectivo).
 * Las clases legacy (estado_pago no_aplica, sin cobro) también cierran aquí.
 */
export async function cerrarSesion(formData: FormData): Promise<void> {
  const { acompananteId, esSuperadmin } = await autorizacion();
  const reservaId = formData.get("reserva_id") as string;

  await db
    .update(reservas)
    .set({ estado: "completada" })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.estado, "confirmada"),
        inArray(reservas.estadoPago, ["pagada", "cobrada", "no_aplica"]),
        filtroAsignacion(acompananteId, esSuperadmin)
      )
    );

  revalidatePath("/acompanante/reservas");
}

/**
 * Notas privadas de la gestión (solo acompañante asignado / superadmin).
 * Aviso RGPD en el textarea: jamás se muestran al cliente ni van a emails/logs.
 */
export async function guardarNotasGestion(formData: FormData): Promise<void> {
  const { acompananteId, esSuperadmin } = await autorizacion();
  const reservaId = formData.get("reserva_id") as string;
  const notas = ((formData.get("notas") as string) || "").trim();

  await db
    .update(reservas)
    .set({ notasAcompanante: notas || null })
    .where(
      and(
        eq(reservas.id, reservaId),
        inArray(reservas.estado, ["confirmada", "completada"]),
        filtroAsignacion(acompananteId, esSuperadmin)
      )
    );

  revalidatePath("/acompanante/reservas");
}
