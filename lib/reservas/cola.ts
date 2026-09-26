"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { acompanantes, profiles, reservas } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getMiAcompananteId } from "@/lib/db/queries/acompanante";
import { isLocale, localePath } from "@/lib/i18n/config";
import { asignarReservaACandidato } from "@/lib/reservas/asignarCore";
import { emailPeticionLiberada } from "@/lib/email";
import { fechaHoraMadrid } from "@/lib/tiempo";

/**
 * Autoservicio de la cola (C1.5): el acompañante activo con gestiones
 * activadas acepta peticiones sin asignar (claim idempotente, precio con SU
 * zona base) o libera las que aceptó mientras sigan pre-pago (vuelven a la
 * cola y el cliente recibe un aviso; nunca hay dinero movido).
 */

function localeDe(formData: FormData) {
  const raw = formData.get("locale") as string;
  return isLocale(raw) ? raw : "es";
}

/** Acepta una petición en cola: asignación real con precio del asignado. */
export async function aceptarPeticion(formData: FormData): Promise<void> {
  const locale = localeDe(formData);
  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, "/auth/login"));
  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) redirect(localePath(locale, "/acompanante"));

  const reservaId = formData.get("reserva_id") as string;
  if (!reservaId) return;

  const r = await asignarReservaACandidato({ reservaId, acompananteId });
  if (!r.ok) {
    if (r.motivo === "precio" || r.motivo === "candidato_invalido") {
      redirect(localePath(locale, "/acompanante/peticiones?error_precio=1"));
    }
    // cola_perdida: otro (admin u otro acompañante) se la llevó; silencio.
  }

  revalidatePath("/acompanante/peticiones");
  revalidatePath("/acompanante/reservas");
  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
  revalidatePath(`/cliente/reservas/${reservaId}`);
  redirect(localePath(locale, "/acompanante/peticiones"));
}

/** Devuelve a la cola una petición que él aceptó, solo si sigue pre-pago. */
export async function liberarPeticion(formData: FormData): Promise<void> {
  const locale = localeDe(formData);
  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, "/auth/login"));
  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) redirect(localePath(locale, "/acompanante"));

  const reservaId = formData.get("reserva_id") as string;
  if (!reservaId) return;

  // Solo asignadas a mí, en cola, pre-pago y sin payment intent: imposible
  // liberar una vez cobrado o confirmada.
  const liberadas = await db
    .update(reservas)
    .set({
      acompananteId: null,
      precioTotalCents: null,
      precioDesglose: null,
      asignadoAt: null,
    })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.acompananteId, acompananteId),
        eq(reservas.estado, "pendiente"),
        inArray(reservas.estadoPago, ["pendiente_pago", "pendiente_cobro"]),
        isNull(reservas.stripePaymentIntentId)
      )
    )
    .returning({ clienteId: reservas.clienteId, fechaHora: reservas.fechaHora });
  if (liberadas.length === 0) return;

  const { clienteId, fechaHora } = liberadas[0];
  const [acomp] = await db
    .select({ nombrePublico: acompanantes.nombrePublico })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);
  const [cliente] = await db
    .select({
      email: profiles.email,
      nombre: profiles.nombre,
      idioma: profiles.idiomaPreferido,
    })
    .from(profiles)
    .where(eq(profiles.id, clienteId))
    .limit(1);

  if (cliente?.email) {
    emailPeticionLiberada({
      toEmail: cliente.email,
      clienteNombre: cliente.nombre ?? "Cliente",
      acompananteNombre: acomp?.nombrePublico ?? "Costa Companion",
      fechaStr: fechaHoraMadrid(fechaHora),
      idioma: cliente.idioma ?? undefined,
    });
  }

  revalidatePath("/acompanante/peticiones");
  revalidatePath("/acompanante/reservas");
  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
  redirect(localePath(locale, "/acompanante/peticiones"));
}
