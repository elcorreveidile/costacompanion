"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { acompanantes, profiles } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";

/**
 * Inicia el cobro de un acompañante según el modelo vigente:
 *   - 49 € de ALTA (pago único, en la primera factura)
 *   - 19 €/mes de CUOTA fija (suscripción)
 * Se dispara al confirmar su 1ª reserva. Gratis (sin_suscripcion) hasta entonces.
 *
 * Idempotente: si ya tiene stripe_customer_id, no hace nada. Nunca lanza: quien
 * llama (confirmación de reserva) no debe romperse si el cobro falla; el admin
 * puede reintentar desde el panel.
 *
 * Requiere precios en Stripe:
 *   STRIPE_PRICE_ACOMP_SETUP  → 49 € pago único
 *   STRIPE_PRICE_ACOMP_CUOTA  → 19 €/mes recurrente (fallback: STRIPE_PRICE_ACOMP_STANDARD)
 */
export async function iniciarCobroAcompanante(
  acompananteId: string
): Promise<{ error?: string; yaActivo?: boolean }> {
  const SETUP = process.env.STRIPE_PRICE_ACOMP_SETUP;
  const CUOTA =
    process.env.STRIPE_PRICE_ACOMP_CUOTA ?? process.env.STRIPE_PRICE_ACOMP_STANDARD;

  if (!SETUP || !CUOTA) {
    return { error: "Precios STRIPE_PRICE_ACOMP_SETUP/CUOTA no configurados." };
  }

  const [acomp] = await db
    .select({
      id: acompanantes.id,
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      stripeCustomerId: acompanantes.stripeCustomerId,
      profileEmail: profiles.email,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  if (!acomp) return { error: "Acompañante no encontrado." };
  if (acomp.stripeCustomerId) return { yaActivo: true }; // ya tiene cobro activo

  const email = acomp.profileEmail ?? acomp.emailContacto;
  if (!email) return { error: "No hay email asociado a este acompañante." };

  try {
    const stripe = getStripe();

    // 1. Cliente en Stripe
    const customer = await stripe.customers.create({
      email,
      name: acomp.nombrePublico,
      metadata: { acompanante_id: acomp.id },
    });

    // 2. Suscripción 19 €/mes + alta 49 € (pago único en la 1ª factura).
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: CUOTA }],
      add_invoice_items: [{ price: SETUP }],
      collection_method: "send_invoice",
      days_until_due: 30,
    });

    // 3. Finalizar y enviar la primera factura (nace como borrador).
    const drafts = await stripe.invoices.list({
      subscription: subscription.id,
      status: "draft",
      limit: 1,
    });
    if (drafts.data[0]?.id) {
      const finalized = await stripe.invoices.finalizeInvoice(drafts.data[0].id);
      if (finalized.id) await stripe.invoices.sendInvoice(finalized.id);
    }

    // 4. Persistir y mantener la ficha activa.
    await db
      .update(acompanantes)
      .set({
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: "active",
        activo: true,
      })
      .where(eq(acompanantes.id, acompananteId));

    revalidatePath("/admin/acompanantes");
    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error en Stripe";
    console.error("iniciarCobroAcompanante:", err);
    return { error: msg };
  }
}
