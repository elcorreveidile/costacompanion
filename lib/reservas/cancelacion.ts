"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes,
  configPrecios,
  profiles,
  reservas,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getMiAcompananteId } from "@/lib/db/queries/acompanante";
import { getStripe } from "@/lib/stripe";
import { formatEuros } from "@/lib/precios";
import { fechaHoraMadrid, horasHasta } from "@/lib/tiempo";
import { emailReservaCancelada } from "@/lib/email";
import { enviarPushAPerfil } from "@/lib/push/send";
import { pushStrings } from "@/lib/push/strings";
import { isLocale } from "@/lib/i18n/config";

type Politica = "gratuita" | "mitad" | "sin_reembolso";

/** Plazos de cancelación desde config_precios (editables en /admin/tarifas). */
async function plazosCancelacion(): Promise<{ gratis: number; mitad: number }> {
  const rows = await db
    .select({
      clave: configPrecios.clave,
      valor: configPrecios.valorEntero,
    })
    .from(configPrecios)
    .where(
      inArray(configPrecios.clave, [
        "cancelacion_horas_gratis",
        "cancelacion_horas_mitad",
      ])
    );
  const map = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
  return {
    gratis: map.cancelacion_horas_gratis ?? 48,
    mitad: map.cancelacion_horas_mitad ?? 24,
  };
}

/** >48 h ⇒ gratuita · 24–48 h ⇒ mitad · <24 h ⇒ sin reembolso. */
function politicaPorHoras(horas: number, plazos: { gratis: number; mitad: number }): Politica {
  if (horas > plazos.gratis) return "gratuita";
  if (horas > plazos.mitad) return "mitad";
  return "sin_reembolso";
}

/** Reembolsa un PaymentIntent (total o parcial). Nunca lanza: el fallo se registra y la reserva queda «pagada» para la cola de reembolsos de admin. */
async function reembolsarStripe(
  paymentIntentId: string | null,
  cents: number
): Promise<{ ok: boolean; refundId: string | null }> {
  if (!paymentIntentId || cents <= 0) return { ok: false, refundId: null };
  try {
    const refund = await getStripe().refunds.create({
      payment_intent: paymentIntentId,
      amount: cents,
    });
    return { ok: true, refundId: refund.id };
  } catch (e) {
    console.error("reembolsarStripe (importe pendiente):", e);
    return { ok: false, refundId: null };
  }
}

/**
 * Cancelación por parte del cliente (solo gestiones).
 * Política: >48 h gratis · 24–48 h 50 % (solo tarjeta) · <24 h sin reembolso.
 * Efectivo: no hay nada que reembolsar nunca.
 */
export async function cancelarReservaGestion(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;

  const [r] = await db
    .select({
      estado: reservas.estado,
      fechaHora: reservas.fechaHora,
      metodoPago: reservas.metodoPago,
      estadoPago: reservas.estadoPago,
      precioTotalCents: reservas.precioTotalCents,
      paymentIntentId: reservas.stripePaymentIntentId,
      checkoutSessionId: reservas.stripeCheckoutSessionId,
      acompNombre: acompanantes.nombrePublico,
      acompProfileId: acompanantes.profileId,
    })
    .from(reservas)
    // leftJoin: una petición en cola (sin acompañante, Fase C1) también se puede cancelar
    .leftJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
    .where(and(eq(reservas.id, reservaId), eq(reservas.clienteId, user.id)))
    .limit(1);

  // Solo gestiones propias, activas y futuras.
  if (!r || r.metodoPago === null || r.fechaHora.getTime() <= Date.now()) return;
  if (r.estado !== "pendiente" && r.estado !== "confirmada") return;

  const politica = politicaPorHoras(
    horasHasta(new Date(), r.fechaHora),
    await plazosCancelacion()
  );

  let reembolsoCents = 0;
  let refundId: string | null = null;
  let estadoPagoFinal: "no_aplica" | "pagada" | "reembolsada" = "no_aplica";

  if (r.estadoPago === "pagada") {
    const importe =
      politica === "gratuita"
        ? (r.precioTotalCents ?? 0)
        : politica === "mitad"
          ? Math.round((r.precioTotalCents ?? 0) / 2)
          : 0;
    if (importe > 0) {
      const res = await reembolsarStripe(r.paymentIntentId, importe);
      if (res.ok) {
        reembolsoCents = importe;
        refundId = res.refundId;
        estadoPagoFinal = "reembolsada";
      } else {
        // Reembolso fallido: queda «pagada» ⇒ cola de /admin/reservas.
        estadoPagoFinal = "pagada";
      }
    } else {
      estadoPagoFinal = "pagada"; // sin_reembolso (<24 h)
    }
  }

  // Transición condicional (idempotencia sin transacciones: solo una llamada gana).
  const actualizadas = await db
    .update(reservas)
    .set({
      estado: "cancelada",
      estadoPago: estadoPagoFinal,
      reembolsoCents,
      stripeRefundId: refundId,
      politicaAplicada: politica,
      canceladaPor: "cliente",
      canceladaMotivo: "cancelacion_cliente",
      canceladaAt: new Date(),
    })
    .where(
      and(
        eq(reservas.id, reservaId),
        inArray(reservas.estado, ["pendiente", "confirmada"])
      )
    )
    .returning({ id: reservas.id });

  if (actualizadas.length === 0) return; // otra request la movió antes

  // Si había una sesión de Checkout viva, fuera (ya no se puede pagar).
  if (r.estadoPago === "pendiente_pago" && r.checkoutSessionId) {
    await getStripe()
      .checkout.sessions.expire(r.checkoutSessionId)
      .catch(() => undefined);
  }

  const [cliente] = await db
    .select({
      email: profiles.email,
      nombre: profiles.nombre,
      idioma: profiles.idiomaPreferido,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (cliente?.email) {
    emailReservaCancelada({
      toEmail: cliente.email,
      clienteNombre: cliente.nombre ?? "Cliente",
      acompananteNombre: r.acompNombre ?? "Costa Companion", // cola: aún sin acompañante
      fechaStr: fechaHoraMadrid(r.fechaHora),
      importeReembolsadoStr:
        reembolsoCents > 0 ? formatEuros(reembolsoCents) : undefined,
      idioma: cliente.idioma ?? undefined,
    });
  }

  // Push de cancelación: al cliente y al acompañante (fire-and-forget).
  const fechaStr = fechaHoraMadrid(r.fechaHora);
  const pCliente =
    pushStrings[isLocale(cliente?.idioma) ? cliente.idioma : "es"];
  enviarPushAPerfil(user.id, {
    title: pCliente.canceladaTitle,
    body: pCliente.canceladaBody({
      acompananteNombre: r.acompNombre ?? "Costa Companion",
      fechaStr,
    }),
    url: "/cliente/reservas",
    tag: `reserva-${reservaId}`,
  }).catch((e) => console.error("push cancelación (cliente):", e));

  if (r.acompProfileId) {
    const [acompProfile] = await db
      .select({ idioma: profiles.idiomaPreferido })
      .from(profiles)
      .where(eq(profiles.id, r.acompProfileId))
      .limit(1);
    const pAcomp =
      pushStrings[isLocale(acompProfile?.idioma) ? acompProfile.idioma : "es"];
    enviarPushAPerfil(r.acompProfileId, {
      title: pAcomp.canceladaTitle,
      body: pAcomp.canceladaBody({
        acompananteNombre: r.acompNombre ?? "Costa Companion",
        fechaStr,
      }),
      url: "/acompanante/reservas",
      tag: `reserva-${reservaId}`,
    }).catch((e) => console.error("push cancelación (acompañante):", e));
  }

  revalidatePath("/cliente/reservas");
  revalidatePath("/acompanante/reservas");
}

/**
 * Reembolso manual total (superadmin): cola de reembolsos fallidos y casos
 * de soporte. Condicionado a estadoPago='pagada' ⇒ no duplica.
 */
export async function reembolsarReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.rol !== "superadmin") return;

  const reservaId = formData.get("reserva_id") as string;

  const [r] = await db
    .select({
      estadoPago: reservas.estadoPago,
      precioTotalCents: reservas.precioTotalCents,
      reembolsoCents: reservas.reembolsoCents,
      paymentIntentId: reservas.stripePaymentIntentId,
    })
    .from(reservas)
    .where(eq(reservas.id, reservaId))
    .limit(1);

  if (!r || r.estadoPago !== "pagada" || !r.paymentIntentId) return;

  const importe = (r.precioTotalCents ?? 0) - (r.reembolsoCents ?? 0);
  if (importe <= 0) return;

  const res = await reembolsarStripe(r.paymentIntentId, importe);
  if (!res.ok) return; // sigue en la cola para reintentar

  await db
    .update(reservas)
    .set({
      estadoPago: "reembolsada",
      reembolsoCents: (r.reembolsoCents ?? 0) + importe,
      stripeRefundId: res.refundId,
    })
    .where(
      and(eq(reservas.id, reservaId), eq(reservas.estadoPago, "pagada"))
    );

  revalidatePath("/admin/reservas");
}

/**
 * Marca no-show (acompañante asignado o superadmin). Sin reembolso en ambos
 * métodos; el 2º no-show del cliente bloquea el pago en efectivo (automático).
 */
export async function marcarNoShow(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;

  const [r] = await db
    .select({
      acompananteId: reservas.acompananteId,
      clienteId: reservas.clienteId,
      estado: reservas.estado,
      metodoPago: reservas.metodoPago,
    })
    .from(reservas)
    .where(eq(reservas.id, reservaId))
    .limit(1);

  if (!r || r.estado !== "confirmada") return;

  if (user.rol !== "superadmin") {
    const miId = await getMiAcompananteId(user.id);
    if (!miId || miId !== r.acompananteId) return;
  }

  const actualizadas = await db
    .update(reservas)
    .set({
      estado: "cancelada",
      estadoPago: r.metodoPago === "efectivo" ? "no_aplica" : "pagada",
      politicaAplicada: "no_show",
      noShow: true,
      noShowAt: new Date(),
      canceladaPor: user.rol === "superadmin" ? "superadmin" : "acompanante",
      canceladaMotivo: "no_show",
      canceladaAt: new Date(),
    })
    .where(and(eq(reservas.id, reservaId), eq(reservas.estado, "confirmada")))
    .returning({ id: reservas.id });

  if (actualizadas.length === 0) return;

  // 2º no-show del cliente ⇒ prepago obligatorio a partir de ahora.
  const [{ n }] = await db
    .select({ n: count() })
    .from(reservas)
    .where(
      and(eq(reservas.clienteId, r.clienteId), eq(reservas.noShow, true))
    );
  if (n >= 2) {
    await db
      .update(profiles)
      .set({ efectivoBloqueado: true })
      .where(eq(profiles.id, r.clienteId));
  }

  revalidatePath("/acompanante/reservas");
  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
}
