import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import { acompanantes, anunciantes } from '@/lib/db/schema';

// El body RAW es imprescindible para verificar la firma de Stripe.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Configuración de webhook incompleta' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const cid = extractCustomerId(invoice.customer);
        if (cid) await updateStatusByCustomer(cid, 'active');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const cid = extractCustomerId(invoice.customer);
        if (cid) await updateStatusByCustomer(cid, 'past_due');
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const cid = extractCustomerId(sub.customer);
        if (cid) {
          await updateSubscriptionByCustomer(cid, sub.id, mapStripeStatus(sub.status));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const cid = extractCustomerId(sub.customer);
        if (cid) await updateStatusByCustomer(cid, 'canceled');
        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    // Devolver 200 para que Stripe no reintente
  }

  return NextResponse.json({ received: true });
}

// Actualiza en acompañantes; si no hay match, intenta en anunciantes.
async function updateStatusByCustomer(
  customerId: string,
  status: string
): Promise<void> {
  const mapped = mapStripeStatus(status);

  const [acomp] = await db
    .select({ id: acompanantes.id })
    .from(acompanantes)
    .where(eq(acompanantes.stripeCustomerId, customerId))
    .limit(1);

  if (acomp) {
    await db
      .update(acompanantes)
      .set({ stripeSubscriptionStatus: mapped })
      .where(eq(acompanantes.stripeCustomerId, customerId));
  } else {
    await db
      .update(anunciantes)
      .set({ stripeSubscriptionStatus: mapped })
      .where(eq(anunciantes.stripeCustomerId, customerId));
  }
}

async function updateSubscriptionByCustomer(
  customerId: string,
  subscriptionId: string,
  status: ReturnType<typeof mapStripeStatus>
): Promise<void> {
  const [acomp] = await db
    .select({ id: acompanantes.id })
    .from(acompanantes)
    .where(eq(acompanantes.stripeCustomerId, customerId))
    .limit(1);

  if (acomp) {
    await db
      .update(acompanantes)
      .set({ stripeSubscriptionId: subscriptionId, stripeSubscriptionStatus: status })
      .where(eq(acompanantes.stripeCustomerId, customerId));
  } else {
    await db
      .update(anunciantes)
      .set({ stripeSubscriptionId: subscriptionId, stripeSubscriptionStatus: status })
      .where(eq(anunciantes.stripeCustomerId, customerId));
  }
}

function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  return customer.id;
}
