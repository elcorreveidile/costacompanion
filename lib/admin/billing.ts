'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

interface AcompananteStripe {
  id: string;
  nombre_publico: string;
  email_contacto: string | null;
  profile_id: string;
  stripe_customer_id: string | null;
}

export async function activarConStripe(
  acompananteId: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const SETUP    = process.env.STRIPE_PRICE_ACOMP_SETUP;
  const LAUNCH   = process.env.STRIPE_PRICE_ACOMP_LAUNCH;
  const STANDARD = process.env.STRIPE_PRICE_ACOMP_STANDARD;

  if (!SETUP || !LAUNCH || !STANDARD) {
    return { error: 'Variables STRIPE_PRICE_ACOMP_* no configuradas.' };
  }

  // Cargar datos del acompañante
  const { data: acomp } = await (admin as RawClient)
    .from('acompanantes')
    .select('id, nombre_publico, email_contacto, profile_id, stripe_customer_id')
    .eq('id', acompananteId)
    .single() as { data: AcompananteStripe | null };

  if (!acomp) return { error: 'Acompañante no encontrado.' };
  if (acomp.stripe_customer_id) return { error: 'Este acompañante ya tiene suscripción Stripe.' };

  // Obtener email del usuario en Auth
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(acomp.profile_id);
  const email = authUser?.email ?? acomp.email_contacto;
  if (!email) return { error: 'No hay email asociado a este acompañante.' };

  try {
    // 1. Crear customer en Stripe
    const customer = await stripe.customers.create({
      email,
      name: acomp.nombre_publico,
      metadata: { acompanante_id: acomp.id },
    });

    // 2. Crear suscripción con subscriptionSchedule:
    //    Fase 1: precio lanzamiento × 12 meses + cargo único de setup en la primera factura
    //    Fase 2: precio estándar indefinido
    const schedule = await stripe.subscriptionSchedules.create({
      customer: customer.id,
      start_date: 'now',
      end_behavior: 'release',
      phases: [
        {
          items: [{ price: LAUNCH }],
          duration: { interval: 'month', interval_count: 12 },
          collection_method: 'send_invoice',
          invoice_settings: { days_until_due: 30 },
          add_invoice_items: [{ price: SETUP }],
        },
        {
          items: [{ price: STANDARD }],
          collection_method: 'send_invoice',
          invoice_settings: { days_until_due: 30 },
        },
      ],
    });

    const subscriptionId = typeof schedule.subscription === 'string'
      ? schedule.subscription
      : (schedule.subscription as { id: string } | null)?.id ?? null;

    // 3. Finalizar y enviar la primera factura (empieza como borrador)
    if (subscriptionId) {
      const drafts = await stripe.invoices.list({
        subscription: subscriptionId,
        status: 'draft',
        limit: 1,
      });
      if (drafts.data[0]) {
        const finalized = await stripe.invoices.finalizeInvoice(drafts.data[0].id);
        await stripe.invoices.sendInvoice(finalized.id);
      }
    }

    // 4. Persistir en Supabase y activar al acompañante
    await (admin as RawClient)
      .from('acompanantes')
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: 'active',
        activo: true,
      })
      .eq('id', acompananteId);

    revalidatePath('/admin/acompanantes');
    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error en Stripe';
    console.error('activarConStripe error:', err);
    return { error: msg };
  }
}

export async function sincronizarEstadoStripe(
  customerId: string,
  status: string
): Promise<void> {
  const admin = createAdminClient();
  await (admin as RawClient)
    .from('acompanantes')
    .update({ stripe_subscription_status: mapStripeStatus(status) })
    .eq('stripe_customer_id', customerId);
  revalidatePath('/admin/acompanantes');
}

interface AcompananteSubscripcion {
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export async function cancelarSuscripcionAdmin(
  acompananteId: string,
  inmediato: boolean = false
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: acomp } = await (admin as RawClient)
    .from('acompanantes')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('id', acompananteId)
    .single() as { data: AcompananteSubscripcion | null };

  if (!acomp?.stripe_subscription_id) return { error: 'Sin suscripción activa.' };

  try {
    if (inmediato) {
      await stripe.subscriptions.cancel(acomp.stripe_subscription_id);
      await (admin as RawClient)
        .from('acompanantes')
        .update({ stripe_subscription_status: 'canceled', activo: false })
        .eq('id', acompananteId);
    } else {
      await stripe.subscriptions.update(acomp.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }
    revalidatePath('/admin/acompanantes');
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}

export async function reactivarSuscripcionAdmin(
  acompananteId: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: acomp } = await (admin as RawClient)
    .from('acompanantes')
    .select('stripe_subscription_id')
    .eq('id', acompananteId)
    .single() as { data: AcompananteSubscripcion | null };

  if (!acomp?.stripe_subscription_id) return { error: 'Sin suscripción.' };

  try {
    await stripe.subscriptions.update(acomp.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    revalidatePath('/admin/acompanantes');
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}
