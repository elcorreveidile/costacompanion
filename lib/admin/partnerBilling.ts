'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { anunciantes, profiles } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getStripe, mapStripeStatus } from '@/lib/stripe';

async function requireSuperadmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.rol === 'superadmin';
}

export async function activarAnuncianteConStripe(
  anuncianteId: string
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };
  const stripe = getStripe();

  const BASIC    = process.env.STRIPE_PRICE_PARTNER_BASIC;
  const FEATURED = process.env.STRIPE_PRICE_PARTNER_FEATURED;

  if (!BASIC || !FEATURED) {
    return { error: 'Variables STRIPE_PRICE_PARTNER_* no configuradas.' };
  }

  const [anunc] = await db
    .select({
      id: anunciantes.id,
      nombreNegocio: anunciantes.nombreNegocio,
      email: anunciantes.email,
      stripeCustomerId: anunciantes.stripeCustomerId,
      plan: anunciantes.plan,
      profileEmail: profiles.email,
    })
    .from(anunciantes)
    .leftJoin(profiles, eq(profiles.id, anunciantes.profileId))
    .where(eq(anunciantes.id, anuncianteId))
    .limit(1);

  if (!anunc) return { error: 'Anunciante no encontrado.' };
  if (anunc.stripeCustomerId) return { error: 'Este anunciante ya tiene suscripción Stripe.' };

  const email = anunc.email ?? anunc.profileEmail;
  if (!email) return { error: 'No hay email asociado a este anunciante.' };

  const priceId = anunc.plan === 'destacado' ? FEATURED : BASIC;

  try {
    const customer = await stripe.customers.create({
      email,
      name: anunc.nombreNegocio,
      metadata: { anunciante_id: anunc.id },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      collection_method: 'send_invoice',
      days_until_due: 30,
    });

    // Finalizar y enviar la primera factura
    const drafts = await stripe.invoices.list({
      subscription: subscription.id,
      status: 'draft',
      limit: 1,
    });
    if (drafts.data[0]) {
      const finalized = await stripe.invoices.finalizeInvoice(drafts.data[0].id);
      await stripe.invoices.sendInvoice(finalized.id);
    }

    await db
      .update(anunciantes)
      .set({
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: mapStripeStatus(subscription.status),
        activo: true,
      })
      .where(eq(anunciantes.id, anuncianteId));

    revalidatePath('/admin/anunciantes');
    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error en Stripe';
    console.error('activarAnuncianteConStripe error:', err);
    return { error: msg };
  }
}

export async function cancelarAnuncianteAdmin(
  anuncianteId: string,
  inmediato: boolean = false
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };
  const stripe = getStripe();

  const [anunc] = await db
    .select({ stripeSubscriptionId: anunciantes.stripeSubscriptionId })
    .from(anunciantes)
    .where(eq(anunciantes.id, anuncianteId))
    .limit(1);

  if (!anunc?.stripeSubscriptionId) return { error: 'Sin suscripción activa.' };

  try {
    if (inmediato) {
      await stripe.subscriptions.cancel(anunc.stripeSubscriptionId);
      await db
        .update(anunciantes)
        .set({ stripeSubscriptionStatus: 'canceled', activo: false })
        .where(eq(anunciantes.id, anuncianteId));
    } else {
      await stripe.subscriptions.update(anunc.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
    revalidatePath('/admin/anunciantes');
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}

export async function reactivarAnuncianteAdmin(
  anuncianteId: string
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };
  const stripe = getStripe();

  const [anunc] = await db
    .select({ stripeSubscriptionId: anunciantes.stripeSubscriptionId })
    .from(anunciantes)
    .where(eq(anunciantes.id, anuncianteId))
    .limit(1);

  if (!anunc?.stripeSubscriptionId) return { error: 'Sin suscripción.' };

  try {
    await stripe.subscriptions.update(anunc.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    revalidatePath('/admin/anunciantes');
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}

export async function sincronizarEstadoStripeAnunciante(
  customerId: string,
  status: string
): Promise<void> {
  await db
    .update(anunciantes)
    .set({ stripeSubscriptionStatus: mapStripeStatus(status) })
    .where(eq(anunciantes.stripeCustomerId, customerId));
  revalidatePath('/admin/anunciantes');
}
