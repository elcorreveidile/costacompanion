'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acompanantes, profiles } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getStripe, mapStripeStatus } from '@/lib/stripe';

async function requireSuperadmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.rol === 'superadmin';
}

export async function activarConStripe(
  acompananteId: string
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };
  const stripe = getStripe();

  const SETUP    = process.env.STRIPE_PRICE_ACOMP_SETUP;
  const LAUNCH   = process.env.STRIPE_PRICE_ACOMP_LAUNCH;
  const STANDARD = process.env.STRIPE_PRICE_ACOMP_STANDARD;

  if (!SETUP || !LAUNCH || !STANDARD) {
    return { error: 'Variables STRIPE_PRICE_ACOMP_* no configuradas.' };
  }

  const [acomp] = await db
    .select({
      id: acompanantes.id,
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      profileId: acompanantes.profileId,
      stripeCustomerId: acompanantes.stripeCustomerId,
      profileEmail: profiles.email,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  if (!acomp) return { error: 'Acompañante no encontrado.' };
  if (acomp.stripeCustomerId) return { error: 'Este acompañante ya tiene suscripción Stripe.' };

  const email = acomp.profileEmail ?? acomp.emailContacto;
  if (!email) return { error: 'No hay email asociado a este acompañante.' };

  try {
    // 1. Crear customer en Stripe
    const customer = await stripe.customers.create({
      email,
      name: acomp.nombrePublico,
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

    // 4. Persistir y activar al acompañante
    await db
      .update(acompanantes)
      .set({
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: 'active',
        activo: true,
      })
      .where(eq(acompanantes.id, acompananteId));

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
