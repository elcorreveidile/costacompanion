'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

interface AnuncianteStripe {
  id: string;
  nombre_negocio: string;
  email: string | null;
  profile_id: string | null;
  stripe_customer_id: string | null;
  plan: 'basico' | 'destacado';
}

interface AnuncianteSubscripcion {
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export async function activarAnuncianteConStripe(
  anuncianteId: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const BASIC    = process.env.STRIPE_PRICE_PARTNER_BASIC;
  const FEATURED = process.env.STRIPE_PRICE_PARTNER_FEATURED;

  if (!BASIC || !FEATURED) {
    return { error: 'Variables STRIPE_PRICE_PARTNER_* no configuradas.' };
  }

  const { data: anunc } = await (admin as RawClient)
    .from('anunciantes')
    .select('id, nombre_negocio, email, profile_id, stripe_customer_id, plan')
    .eq('id', anuncianteId)
    .single() as { data: AnuncianteStripe | null };

  if (!anunc) return { error: 'Anunciante no encontrado.' };
  if (anunc.stripe_customer_id) return { error: 'Este anunciante ya tiene suscripción Stripe.' };

  let email = anunc.email;
  if (!email && anunc.profile_id) {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(anunc.profile_id);
    email = authUser?.email ?? null;
  }
  if (!email) return { error: 'No hay email asociado a este anunciante.' };

  const priceId = anunc.plan === 'destacado' ? FEATURED : BASIC;

  try {
    const customer = await stripe.customers.create({
      email,
      name: anunc.nombre_negocio,
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

    await (admin as RawClient)
      .from('anunciantes')
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: mapStripeStatus(subscription.status),
        activo: true,
      })
      .eq('id', anuncianteId);

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
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: anunc } = await (admin as RawClient)
    .from('anunciantes')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('id', anuncianteId)
    .single() as { data: AnuncianteSubscripcion | null };

  if (!anunc?.stripe_subscription_id) return { error: 'Sin suscripción activa.' };

  try {
    if (inmediato) {
      await stripe.subscriptions.cancel(anunc.stripe_subscription_id);
      await (admin as RawClient)
        .from('anunciantes')
        .update({ stripe_subscription_status: 'canceled', activo: false })
        .eq('id', anuncianteId);
    } else {
      await stripe.subscriptions.update(anunc.stripe_subscription_id, {
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
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: anunc } = await (admin as RawClient)
    .from('anunciantes')
    .select('stripe_subscription_id')
    .eq('id', anuncianteId)
    .single() as { data: AnuncianteSubscripcion | null };

  if (!anunc?.stripe_subscription_id) return { error: 'Sin suscripción.' };

  try {
    await stripe.subscriptions.update(anunc.stripe_subscription_id, {
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
  const admin = createAdminClient();
  await (admin as RawClient)
    .from('anunciantes')
    .update({ stripe_subscription_status: mapStripeStatus(status) })
    .eq('stripe_customer_id', customerId);
  revalidatePath('/admin/anunciantes');
}
