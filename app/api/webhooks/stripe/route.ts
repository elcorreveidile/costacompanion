import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { getStripe, mapStripeStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import { acompanantes, anunciantes, profiles, reservas } from '@/lib/db/schema';
import { formatEuros } from '@/lib/precios';
import { fechaHoraMadrid } from '@/lib/tiempo';
import { emailReservaConfirmada } from '@/lib/email';
import { asignarEnlaceSiRemota } from '@/lib/reservas/videollamada';
import { enviarPushAPerfil } from '@/lib/push/send';
import { pushStrings } from '@/lib/push/strings';
import { isLocale } from '@/lib/i18n/config';

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

  // Los eventos de RESERVA devuelven 500 en fallo transitorio para que Stripe
  // reintente (la idempotencia por UPDATE condicional hace seguro el reintento).
  // Los eventos de suscripción conservan el comportamiento anterior (200 siempre).
  let eventoReserva = false;

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

      // ── Gestiones (pago puntual) ────────────────────────────────────────────

      case 'checkout.session.completed': {
        eventoReserva = true;
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.tipo === 'reserva_gestion') {
          await confirmarReservaPagada(session);
        }
        break;
      }

      case 'checkout.session.expired': {
        eventoReserva = true;
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.tipo === 'reserva_gestion') {
          await cancelarReservaExpirada(session);
        }
        break;
      }

      case 'charge.refunded': {
        eventoReserva = true;
        const charge = event.data.object as Stripe.Charge;
        await registrarReembolsoExterno(charge);
        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    if (eventoReserva) {
      // Stripe reintenta; el UPDATE condicional hace el handler idempotente.
      return NextResponse.json(
        { error: 'Error transitorio procesando evento de reserva' },
        { status: 500 }
      );
    }
    // Devolver 200 para que Stripe no reintente (comportamiento histórico).
  }

  return NextResponse.json({ received: true });
}

// ── Gestiones ─────────────────────────────────────────────────────────────────

/**
 * checkout.session.completed: la gestión pasa a confirmada/pagada.
 * Idempotencia: UPDATE condicional a estadoPago='pendiente_pago'; si 0 filas,
 * el evento ya se procesó (o la reserva se canceló mientras pagaba ⇒ dinero
 * de vuelta automáticamente).
 */
async function confirmarReservaPagada(session: Stripe.Checkout.Session): Promise<void> {
  const reservaId = session.metadata?.reserva_id;
  if (!reservaId) return;

  const pi =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const actualizadas = await db
    .update(reservas)
    .set({
      estado: 'confirmada',
      estadoPago: 'pagada',
      stripePaymentIntentId: pi,
      stripeCheckoutSessionId: session.id,
    })
    .where(and(eq(reservas.id, reservaId), eq(reservas.estadoPago, 'pendiente_pago')))
    .returning({ id: reservas.id });

  if (actualizadas.length === 0) {
    // Ya procesada antes (reintento) ⇒ nada que hacer.
    // ¿O pagó una reserva que se canceló mientras tanto? ⇒ devolver el dinero.
    if (session.payment_status === 'paid' && pi) {
      try {
        await getStripe().refunds.create({ payment_intent: pi });
        console.error(`Reserva ${reservaId} se pagó tras cancelarse: reembolsada en automatico (${pi})`);
      } catch (e) {
        console.error(`CRÍTICO: reserva ${reservaId} pagada tras cancelarse y reembolso fallido (${pi})`, e);
      }
    }
    return;
  }

  // Gestión remota sin enlace ⇒ sala Jitsi autogenerada (idempotente).
  await asignarEnlaceSiRemota(reservaId);

  // Email de confirmación con importe + push al cliente (fire-and-forget).
  const [info] = await db
    .select({
      clienteId: reservas.clienteId,
      fechaHora: reservas.fechaHora,
      precioTotalCents: reservas.precioTotalCents,
      clienteEmail: profiles.email,
      clienteNombre: profiles.nombre,
      clienteIdioma: profiles.idiomaPreferido,
      acompNombre: acompanantes.nombrePublico,
      acompSlug: acompanantes.slug,
    })
    .from(reservas)
    .innerJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
    .innerJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(eq(reservas.id, reservaId))
    .limit(1);

  if (info?.clienteEmail) {
    emailReservaConfirmada({
      toEmail: info.clienteEmail,
      clienteNombre: info.clienteNombre ?? 'Cliente',
      acompananteNombre: info.acompNombre,
      acompananteSlug: info.acompSlug,
      fechaStr: fechaHoraMadrid(info.fechaHora),
      importeStr: formatEuros(info.precioTotalCents ?? 0),
      idioma: info.clienteIdioma ?? undefined,
    });
  }

  if (info) {
    const p = pushStrings[isLocale(info.clienteIdioma) ? info.clienteIdioma : 'es'];
    enviarPushAPerfil(info.clienteId, {
      title: p.confirmadaTitle,
      body: p.confirmadaBody({
        acompananteNombre: info.acompNombre,
        fechaStr: fechaHoraMadrid(info.fechaHora),
      }),
      url: '/cliente/reservas',
      tag: `reserva-${reservaId}`,
    }).catch((e) => console.error('push confirmación (webhook):', e));
  }
}

/**
 * checkout.session.expired: el cliente no pagó a tiempo ⇒ cancelada/no_aplica
 * y la franja queda libre. Idempotente por el mismo mecanismo.
 */
async function cancelarReservaExpirada(session: Stripe.Checkout.Session): Promise<void> {
  const reservaId = session.metadata?.reserva_id;
  if (!reservaId) return;

  await db
    .update(reservas)
    .set({
      estado: 'cancelada',
      estadoPago: 'no_aplica',
      canceladaPor: 'sistema',
      canceladaMotivo: 'expirada_pago',
      canceladaAt: new Date(),
    })
    .where(and(eq(reservas.id, reservaId), eq(reservas.estadoPago, 'pendiente_pago')));
}

/**
 * charge.refunded (p. ej. reembolso hecho desde el Dashboard de Stripe):
 * refleja el estado y el importe acumulado reembolsado.
 */
async function registrarReembolsoExterno(charge: Stripe.Charge): Promise<void> {
  const pi =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;
  if (!pi) return;

  await db
    .update(reservas)
    .set({ estadoPago: 'reembolsada', reembolsoCents: charge.amount_refunded })
    .where(
      and(
        eq(reservas.stripePaymentIntentId, pi),
        eq(reservas.estadoPago, 'pagada')
      )
    );
}

// ── Suscripciones (acompañantes / anunciantes) ────────────────────────────────

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
