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
import {
  emailNuevaReserva,
  emailReservaConfirmada,
  emailReservaRechazada,
} from "@/lib/email";

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
): Promise<{ email: string | null; nombre: string | null }> {
  const [p] = await db
    .select({ email: profiles.email, nombre: profiles.nombre })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return { email: p?.email ?? null, nombre: p?.nombre ?? null };
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
    })
    .from(acompanantes)
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
    .select({ nombrePublico: acompanantes.nombrePublico, slug: acompanantes.slug })
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

  if (reserva?.disponibilidadId) {
    await db
      .update(disponibilidad)
      .set({ estado: "cerrado" })
      .where(eq(disponibilidad.id, reserva.disponibilidadId));
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
      });
    }
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
    .select({ clienteId: reservas.clienteId, fechaHora: reservas.fechaHora })
    .from(reservas)
    .where(and(eq(reservas.id, reservaId), eq(reservas.acompananteId, acompananteId)))
    .limit(1);

  await db
    .update(reservas)
    .set({ estado: "rechazada" })
    .where(and(eq(reservas.id, reservaId), eq(reservas.acompananteId, acompananteId)));

  if (reserva && acomp) {
    const cliente = await getClienteContacto(reserva.clienteId);
    if (cliente.email) {
      emailReservaRechazada({
        toEmail: cliente.email,
        clienteNombre: cliente.nombre ?? "Cliente",
        acompananteNombre: acomp.nombrePublico,
        acompananteSlug: acomp.slug,
        fechaStr: formatFecha(reserva.fechaHora),
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
