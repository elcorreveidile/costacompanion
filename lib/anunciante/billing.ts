'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { anunciantes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getStripe } from '@/lib/stripe';

export async function accederPortalStripeAnunciante(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const [anunc] = await db
    .select({ stripeCustomerId: anunciantes.stripeCustomerId })
    .from(anunciantes)
    .where(eq(anunciantes.profileId, user.id))
    .limit(1);

  if (!anunc?.stripeCustomerId) return;

  const session = await getStripe().billingPortal.sessions.create({
    customer: anunc.stripeCustomerId,
    return_url: 'https://www.costacompanion.com/anunciante',
  });

  redirect(session.url);
}

export async function cancelarMiSuscripcionAnunciante(): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const [anunc] = await db
    .select({ stripeSubscriptionId: anunciantes.stripeSubscriptionId })
    .from(anunciantes)
    .where(eq(anunciantes.profileId, user.id))
    .limit(1);

  if (!anunc?.stripeSubscriptionId) return { error: 'Sin suscripción activa.' };

  try {
    await getStripe().subscriptions.update(anunc.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}
