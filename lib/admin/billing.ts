'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acompanantes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import { iniciarCobroAcompanante } from '@/lib/acompanante/altaCobro';

async function requireSuperadmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.rol === 'superadmin';
}

/**
 * Activación manual del cobro desde el panel (reintento/override). Aplica el
 * mismo modelo que el automático: 49 € de alta (pago único) + 19 €/mes.
 * El cobro real se dispara solo al confirmar la 1ª reserva; este botón sirve
 * para arrancarlo a mano si hiciera falta.
 */
export async function activarConStripe(
  acompananteId: string
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };

  const res = await iniciarCobroAcompanante(acompananteId);
  if (res.yaActivo) return { error: 'Este acompañante ya tiene suscripción Stripe.' };
  return res.error ? { error: res.error } : {};
}

export async function sincronizarEstadoStripe(
  customerId: string,
  status: string
): Promise<void> {
  await db
    .update(acompanantes)
    .set({ stripeSubscriptionStatus: mapStripeStatus(status) })
    .where(eq(acompanantes.stripeCustomerId, customerId));
  revalidatePath('/admin/acompanantes');
}

export async function cancelarSuscripcionAdmin(
  acompananteId: string,
  inmediato: boolean = false
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };
  const stripe = getStripe();

  const [acomp] = await db
    .select({ stripeSubscriptionId: acompanantes.stripeSubscriptionId })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  if (!acomp?.stripeSubscriptionId) return { error: 'Sin suscripción activa.' };

  try {
    if (inmediato) {
      await stripe.subscriptions.cancel(acomp.stripeSubscriptionId);
      await db
        .update(acompanantes)
        .set({ stripeSubscriptionStatus: 'canceled', activo: false })
        .where(eq(acompanantes.id, acompananteId));
    } else {
      await stripe.subscriptions.update(acomp.stripeSubscriptionId, {
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
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };
  const stripe = getStripe();

  const [acomp] = await db
    .select({ stripeSubscriptionId: acompanantes.stripeSubscriptionId })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  if (!acomp?.stripeSubscriptionId) return { error: 'Sin suscripción.' };

  try {
    await stripe.subscriptions.update(acomp.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    revalidatePath('/admin/acompanantes');
    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error en Stripe' };
  }
}
