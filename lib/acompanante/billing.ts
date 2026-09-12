'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acompanantes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getStripe } from '@/lib/stripe';

export async function accederPortalStripe(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const [acomp] = await db
    .select({ stripeCustomerId: acompanantes.stripeCustomerId })
    .from(acompanantes)
    .where(eq(acompanantes.profileId, user.id))
    .limit(1);

  if (!acomp?.stripeCustomerId) return;

  const session = await getStripe().billingPortal.sessions.create({
    customer: acomp.stripeCustomerId,
    return_url: 'https://www.costacompanion.com/acompanante',
  });

  redirect(session.url);
}

export async function cancelarMiSuscripcion(): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const [acomp] = await db
    .select({ stripeSubscriptionId: acompanantes.stripeSubscriptionId })
    .from(acompanantes)
    .where(eq(acompanantes.profileId, user.id))
    .limit(1);

  if (!acomp?.stripeSubscriptionId) return { error: 'Sin suscripción activa.' };

  try {
    await getStripe().subscriptions.update(acomp.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}
