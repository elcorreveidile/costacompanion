"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { acompanantes, reservas } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe";
import { isLocale, localePath } from "@/lib/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Crea (o recrea) la sesión de Stripe Checkout para pagar una gestión
 * pendiente de pago y redirige al cliente a la página de Stripe.
 *
 * Reglas Neon-HTTP (sin transacciones):
 *  - La reserva SIEMPRE existe antes de cobrar (INSERT previo en crearReservaGestion).
 *  - La sesión anterior viva se expira best-effort para evitar dobles pagos.
 *  - El guardado del session id es un UPDATE condicional por estado: si otro
 *    request ya avanzó el pago, no se guarda y no se redirige.
 */
export async function iniciarPagoReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;
  const localeRaw = formData.get("locale") as string;
  const locale = isLocale(localeRaw) ? localeRaw : "es";

  const [row] = await db
    .select({
      clienteId: reservas.clienteId,
      estadoPago: reservas.estadoPago,
      precioTotalCents: reservas.precioTotalCents,
      sessionPrevia: reservas.stripeCheckoutSessionId,
      acompNombre: acompanantes.nombrePublico,
    })
    .from(reservas)
    // leftJoin: una petición en cola (sin acompañante) existe pero no es pagable
    .leftJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
    .where(eq(reservas.id, reservaId))
    .limit(1);

  // Solo el dueño paga; solo gestiones con precio fijado y cobro pendiente.
  if (
    !row ||
    row.clienteId !== user.id ||
    row.estadoPago !== "pendiente_pago" ||
    !row.precioTotalCents ||
    row.precioTotalCents <= 0
  ) {
    redirect(localePath(locale, "/cliente/reservas"));
  }

  // Evita dejar sesiones de Checkout vivas duplicadas para la misma reserva.
  if (row.sessionPrevia) {
    await getStripe()
      .checkout.sessions.expire(row.sessionPrevia)
      .catch(() => undefined); // ya expirada/completada ⇒ irrelevante
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: row.precioTotalCents,
          product_data: {
            name: `Acompañamiento lingüístico · ${row.acompNombre ?? "Costa Companion"}`,
          },
        },
      },
    ],
    metadata: { reserva_id: reservaId, tipo: "reserva_gestion" },
    // Mínimo de Stripe son 30 min; +1 de colchón por deriva de reloj.
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${SITE}${localePath(locale, "/cliente/reservas?pago=ok")}`,
    cancel_url: `${SITE}${localePath(locale, "/cliente/reservas")}`,
  });

  const guardado = await db
    .update(reservas)
    .set({ stripeCheckoutSessionId: session.id })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.estadoPago, "pendiente_pago")
      )
    )
    .returning({ id: reservas.id });

  if (guardado.length === 0) {
    // Otro request movió el estado mientras se creaba la sesión: la sesión
    // creada queda huérfana pero nunca se llegó a mostrar para pagar.
    redirect(localePath(locale, "/cliente/reservas"));
  }

  revalidatePath(localePath(locale, "/cliente/reservas"));
  redirect(session.url ?? localePath(locale, "/cliente/reservas"));
}
