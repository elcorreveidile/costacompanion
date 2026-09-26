"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  reservas,
  acompanantes,
  disponibilidad,
  profiles,
  servicios,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getMiAcompananteId } from "@/lib/db/queries/acompanante";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getStripe } from "@/lib/stripe";
import { iniciarCobroAcompanante } from "@/lib/acompanante/altaCobro";
import {
  asignarEnlaceSiRemota,
  validarEnlaceVideo,
} from "@/lib/reservas/videollamada";
import {
  emailNuevaReserva,
  emailReservaConfirmada,
  emailReservaRechazada,
} from "@/lib/email";
import { enviarPushAPerfil } from "@/lib/push/send";
import { pushStrings } from "@/lib/push/strings";
import { fechaHoraMadrid } from "@/lib/tiempo";

function formatFecha(iso: string | Date) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getClienteContacto(
  userId: string
): Promise<{ email: string | null; nombre: string | null; idioma: string | null }> {
  const [p] = await db
    .select({
      email: profiles.email,
      nombre: profiles.nombre,
      idioma: profiles.idiomaPreferido,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return {
    email: p?.email ?? null,
    nombre: p?.nombre ?? null,
    idioma: p?.idioma ?? null,
  };
}

type Modalidad = "presencial" | "remoto" | "ambos";

export async function crearReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const acompananteId = formData.get("acompanante_id") as string;
  const servicioId = (formData.get("servicio_id") as string | null) || null;
  const disponibilidadId = (formData.get("disponibilidad_id") as string | null) || null;
  const fechaHora = formData.get("fecha_hora") as string;
  const modalidad = formData.get("modalidad") as Modalidad;
  const zona = (formData.get("zona") as string | null) || null;
  const detalleServicio = (formData.get("detalle_servicio") as string | null) || null;

  await db.insert(reservas).values({
    acompananteId,
    clienteId: user.id,
    servicioId,
    disponibilidadId,
    fechaHora: new Date(fechaHora),
    modalidad,
    zona,
    detalleServicio,
    estado: "pendiente",
  });

  // Notificar al acompañante
  const [acomp] = await db
    .select({
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      slug: acompanantes.slug,
      idioma: profiles.idiomaPreferido,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  if (acomp?.emailContacto) {
    const cliente = await getClienteContacto(user.id);
    let servicioNombre: string | undefined;
    if (servicioId) {
      const [svc] = await db
        .select({ titulo: servicios.titulo })
        .from(servicios)
        .where(eq(servicios.id, servicioId))
        .limit(1);
      servicioNombre = (svc?.titulo as { es?: string } | undefined)?.es;
    }
    emailNuevaReserva({
      toEmail: acomp.emailContacto,
      clienteNombre: cliente.nombre ?? user.email ?? "Un cliente",
      acompananteNombre: acomp.nombrePublico,
      fechaStr: formatFecha(fechaHora),
      servicioNombre,
      idioma: acomp.idioma ?? undefined,
    });
  }

  revalidatePath("/cliente/reservas");
  if (user.rol === "cliente") {
    redirect("/cliente/reservas");
  } else {
    redirect(`/${acomp?.slug ?? ""}`);
  }
}

export async function cancelarReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;

  const [reserva] = await db
    .select({ disponibilidadId: reservas.disponibilidadId })
    .from(reservas)
    .where(and(eq(reservas.id, reservaId), eq(reservas.clienteId, user.id)))
    .limit(1);

  await db
    .update(reservas)
    .set({ estado: "cancelada", canceladaAt: new Date() })
    .where(and(eq(reservas.id, reservaId), eq(reservas.clienteId, user.id)));

  if (reserva?.disponibilidadId) {
    await db
      .update(disponibilidad)
      .set({ estado: "abierto" })
      .where(eq(disponibilidad.id, reserva.disponibilidadId));
  }

  revalidatePath("/cliente/reservas");
}

export async function confirmarReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;
  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) {
    revalidatePath("/acompanante/reservas");
    return;
  }

  const [acomp] = await db
    .select({
      nombrePublico: acompanantes.nombrePublico,
      slug: acompanantes.slug,
      stripeCustomerId: acompanantes.stripeCustomerId,
    })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  const [reserva] = await db
    .select({
      disponibilidadId: reservas.disponibilidadId,
      clienteId: reservas.clienteId,
      fechaHora: reservas.fechaHora,
    })
    .from(reservas)
    .where(and(eq(reservas.id, reservaId), eq(reservas.acompananteId, acompananteId)))
    .limit(1);

  await db
    .update(reservas)
    .set({ estado: "confirmada" })
    .where(and(eq(reservas.id, reservaId), eq(reservas.acompananteId, acompananteId)));

  // Gestión remota sin enlace ⇒ sala Jitsi autogenerada (no-op en legacy/presencial).
  await asignarEnlaceSiRemota(reservaId);

  if (reserva?.disponibilidadId) {
    await db
      .update(disponibilidad)
      .set({ estado: "cerrado" })
      .where(eq(disponibilidad.id, reserva.disponibilidadId));
  }

  // 1ª reserva confirmada → arranca el cobro (49 € alta + 19 €/mes). Idempotente
  // por stripe_customer_id; no bloquea la confirmación si el cobro falla.
  if (reserva && !acomp?.stripeCustomerId) {
    iniciarCobroAcompanante(acompananteId).catch((e) =>
      console.error("iniciarCobroAcompanante (confirmarReserva):", e)
    );
  }

  if (reserva && acomp) {
    const cliente = await getClienteContacto(reserva.clienteId);
    if (cliente.email) {
      emailReservaConfirmada({
        toEmail: cliente.email,
        clienteNombre: cliente.nombre ?? "Cliente",
        acompananteNombre: acomp.nombrePublico,
        acompananteSlug: acomp.slug,
        fechaStr: formatFecha(reserva.fechaHora),
        idioma: cliente.idioma ?? undefined,
      });
    }

    // Push de confirmación (efectivo/legacy): mismo mensaje que el webhook.
    const p = pushStrings[isLocale(cliente.idioma) ? cliente.idioma : "es"];
    enviarPushAPerfil(reserva.clienteId, {
      title: p.confirmadaTitle,
      body: p.confirmadaBody({
        acompananteNombre: acomp.nombrePublico,
        fechaStr: fechaHoraMadrid(reserva.fechaHora),
      }),
      url: "/cliente/reservas",
      tag: `reserva-${reservaId}`,
    }).catch((e) => console.error("push confirmación (efectivo):", e));
  }

  revalidatePath("/acompanante/reservas");
}

export async function rechazarReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;
  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) {
    revalidatePath("/acompanante/reservas");
    return;
  }

  const [acomp] = await db
    .select({ nombrePublico: acompanantes.nombrePublico, slug: acompanantes.slug })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  const [reserva] = await db
    .select({
      clienteId: reservas.clienteId,
      fechaHora: reservas.fechaHora,
      estadoPago: reservas.estadoPago,
      precioTotalCents: reservas.precioTotalCents,
      paymentIntentId: reservas.stripePaymentIntentId,
    })
    .from(reservas)
    .where(and(eq(reservas.id, reservaId), eq(reservas.acompananteId, acompananteId)))
    .limit(1);

  await db
    .update(reservas)
    .set({ estado: "rechazada", canceladaPor: "acompanante" })
    .where(and(eq(reservas.id, reservaId), eq(reservas.acompananteId, acompananteId)));

  // Gestión ya pagada ⇒ reembolso íntegro automático. Si el reembolso falla,
  // la reserva queda «pagada» para la cola de /admin/reservas.
  if (reserva?.estadoPago === "pagada" && reserva.paymentIntentId) {
    try {
      const refund = await getStripe().refunds.create({
        payment_intent: reserva.paymentIntentId,
        amount: reserva.precioTotalCents ?? 0,
      });
      await db
        .update(reservas)
        .set({
          estadoPago: "reembolsada",
          reembolsoCents: reserva.precioTotalCents ?? 0,
          stripeRefundId: refund.id,
        })
        .where(eq(reservas.id, reservaId));
    } catch (e) {
      console.error("rechazarReserva: reembolso fallido:", e);
    }
  }

  if (reserva && acomp) {
    const cliente = await getClienteContacto(reserva.clienteId);
    if (cliente.email) {
      emailReservaRechazada({
        toEmail: cliente.email,
        clienteNombre: cliente.nombre ?? "Cliente",
        acompananteNombre: acomp.nombrePublico,
        acompananteSlug: acomp.slug,
        fechaStr: formatFecha(reserva.fechaHora),
        idioma: cliente.idioma ?? undefined,
      });
    }
  }

  revalidatePath("/acompanante/reservas");
}

export async function completarReserva(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;
  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) {
    revalidatePath("/acompanante/reservas");
    return;
  }

  await db
    .update(reservas)
    .set({ estado: "completada" })
    .where(
      and(
        eq(reservas.id, reservaId),
        eq(reservas.acompananteId, acompananteId),
        eq(reservas.estado, "confirmada")
      )
    );

  revalidatePath("/acompanante/reservas");
}

/**
 * Override manual del enlace de videollamada (Meet/Zoom). Acompañante asignado
 * o superadmin. Validación https en el servidor; nunca acepta vacío.
 */
export async function guardarEnlaceVideo(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;
  const url = ((formData.get("enlace_video") as string) || "").trim();
  const localeRaw = formData.get("locale") as string;
  const locale = isLocale(localeRaw) ? localeRaw : "es";
  const back = localePath(locale, "/acompanante/reservas");

  const [r] = await db
    .select({ acompananteId: reservas.acompananteId, estado: reservas.estado })
    .from(reservas)
    .where(eq(reservas.id, reservaId))
    .limit(1);

  let autorizado = false;
  if (r && (r.estado === "pendiente" || r.estado === "confirmada")) {
    if (user.rol === "superadmin") {
      autorizado = true;
    } else {
      const miId = await getMiAcompananteId(user.id);
      autorizado = !!miId && miId === r.acompananteId;
    }
  }
  if (!autorizado) redirect(back);

  if (!url || !validarEnlaceVideo(url)) redirect(`${back}?video_error=1`);

  await db
    .update(reservas)
    .set({ enlaceVideo: url, enlaceVideoOrigen: "manual" })
    .where(eq(reservas.id, reservaId));

  revalidatePath(back);
  redirect(back);
}
