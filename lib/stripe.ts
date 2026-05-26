import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no configurada');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

export function mapStripeStatus(
  status: string
): 'sin_suscripcion' | 'active' | 'past_due' | 'canceled' | 'trialing' {
  switch (status) {
    case 'active':             return 'active';
    case 'trialing':           return 'trialing';
    case 'past_due':           return 'past_due';
    case 'unpaid':             return 'past_due';
    case 'incomplete':         return 'past_due';
    case 'paused':             return 'past_due';
    case 'canceled':           return 'canceled';
    case 'incomplete_expired': return 'canceled';
    default:                   return 'past_due';
  }
}
