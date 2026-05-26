'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

export async function accederPortalStripe(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: acomp } = await (admin as RawClient)
    .from('acompanantes')
    .select('stripe_customer_id')
    .eq('profile_id', user.id)
    .single() as { data: { stripe_customer_id: string | null } | null };

  if (!acomp?.stripe_customer_id) return;

  const session = await getStripe().billingPortal.sessions.create({
    customer: acomp.stripe_customer_id,
    return_url: 'https://www.costacompanion.com/acompanante',
  });

  redirect(session.url);
}

export async function cancelarMiSuscripcion(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: acomp } = await (admin as RawClient)
    .from('acompanantes')
    .select('stripe_subscription_id')
    .eq('profile_id', user.id)
    .single() as { data: { stripe_subscription_id: string | null } | null };

  if (!acomp?.stripe_subscription_id) return { error: 'Sin suscripción activa.' };

  try {
    await getStripe().subscriptions.update(acomp.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}
