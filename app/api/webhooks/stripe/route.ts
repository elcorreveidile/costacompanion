import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

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

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const cid = extractCustomerId(invoice.customer);
        if (cid) await updateStatusByCustomer(admin as RawClient, cid, 'active');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const cid = extractCustomerId(invoice.customer);
        if (cid) await updateStatusByCustomer(admin as RawClient, cid, 'past_due');
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const cid = extractCustomerId(sub.customer);
        if (cid) {
          await updateSubscriptionByCustomer(
            admin as RawClient, cid, sub.id, mapStripeStatus(sub.status)
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const cid = extractCustomerId(sub.customer);
        if (cid) await updateStatusByCustomer(admin as RawClient, cid, 'canceled');
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
  admin: RawClient,
  customerId: string,
  status: string
): Promise<void> {
  const mapped = mapStripeStatus(status);

  const { data: acomp } = await admin
    .from('acompanantes')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (acomp) {
    await admin
      .from('acompanantes')
      .update({ stripe_subscription_status: mapped })
      .eq('stripe_customer_id', customerId);
  } else {
    await admin
      .from('anunciantes')
      .update({ stripe_subscription_status: mapped })
      .eq('stripe_customer_id', customerId);
  }
}

async function updateSubscriptionByCustomer(
  admin: RawClient,
  customerId: string,
  subscriptionId: string,
  status: ReturnType<typeof mapStripeStatus>
): Promise<void> {
  const { data: acomp } = await admin
    .from('acompanantes')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (acomp) {
    await admin
      .from('acompanantes')
      .update({ stripe_subscription_id: subscriptionId, stripe_subscription_status: status })
      .eq('stripe_customer_id', customerId);
  } else {
    await admin
      .from('anunciantes')
      .update({ stripe_subscription_id: subscriptionId, stripe_subscription_status: status })
      .eq('stripe_customer_id', customerId);
  }
}

function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  return customer.id;
}
