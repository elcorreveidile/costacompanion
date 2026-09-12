"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { solicitudes, acompanantes, profiles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getMiAcompananteId } from "@/lib/db/queries/acompanante";
import {
  emailNuevaSolicitud,
  emailSolicitudAceptada,
  emailSolicitudRechazada,
} from "@/lib/email";

type Modalidad = "presencial" | "remoto" | "ambos";

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

export async function crearSolicitud(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const acompananteId = formData.get("acompanante_id") as string;
  const descripcion = formData.get("descripcion") as string;
  const detalleServicio = (formData.get("detalle_servicio") as string | null) || null;
  const fechaHoraDeseadaRaw = (formData.get("fecha_hora_deseada") as string | null) || null;
  const modalidad = formData.get("modalidad") as Modalidad;
  const zona = (formData.get("zona") as string | null) || null;

  await db.insert(solicitudes).values({
    acompananteId,
    clienteId: user.id,
    descripcion,
    detalleServicio,
    fechaHoraDeseada: fechaHoraDeseadaRaw ? new Date(fechaHoraDeseadaRaw) : null,
    modalidad,
    zona,
    estado: "pendiente",
  });

  const [acomp] = await db
    .select({
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
    })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  if (acomp?.emailContacto) {
    const cliente = await getClienteContacto(user.id);
    emailNuevaSolicitud({
      toEmail: acomp.emailContacto,
      clienteNombre: cliente.nombre ?? user.email ?? "Un cliente",
      acompananteNombre: acomp.nombrePublico,
      descripcion,
    });
  }

  revalidatePath("/cliente/solicitudes");
  redirect("/cliente/solicitudes");
}

export async function aceptarSolicitud(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const solicitudId = formData.get("solicitud_id") as string;
  const precioRaw = formData.get("precio_propuesto") as string | null;
  const precioPropuesto = precioRaw ? Number(precioRaw) : null;

  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) {
    revalidatePath("/acompanante/solicitudes");
    return;
  }
  const [acomp] = await db
    .select({ nombrePublico: acompanantes.nombrePublico, slug: acompanantes.slug })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  const [solicitud] = await db
    .select({ clienteId: solicitudes.clienteId })
    .from(solicitudes)
    .where(and(eq(solicitudes.id, solicitudId), eq(solicitudes.acompananteId, acompananteId)))
    .limit(1);

  await db
    .update(solicitudes)
    .set({
      estado: "aceptada",
      precioPropuesto: precioPropuesto === null ? null : precioPropuesto.toString(),
    })
    .where(and(eq(solicitudes.id, solicitudId), eq(solicitudes.acompananteId, acompananteId)));

  if (solicitud && acomp) {
    const cliente = await getClienteContacto(solicitud.clienteId);
    if (cliente.email) {
      emailSolicitudAceptada({
        toEmail: cliente.email,
        clienteNombre: cliente.nombre ?? "Cliente",
        acompananteNombre: acomp.nombrePublico,
        acompananteSlug: acomp.slug,
        precio: precioPropuesto,
      });
    }
  }

  revalidatePath("/acompanante/solicitudes");
}

export async function rechazarSolicitud(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const solicitudId = formData.get("solicitud_id") as string;

  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) {
    revalidatePath("/acompanante/solicitudes");
    return;
  }
  const [acomp] = await db
    .select({ nombrePublico: acompanantes.nombrePublico })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);

  const [solicitud] = await db
    .select({ clienteId: solicitudes.clienteId })
    .from(solicitudes)
    .where(and(eq(solicitudes.id, solicitudId), eq(solicitudes.acompananteId, acompananteId)))
    .limit(1);

  await db
    .update(solicitudes)
    .set({ estado: "rechazada" })
    .where(and(eq(solicitudes.id, solicitudId), eq(solicitudes.acompananteId, acompananteId)));

  if (solicitud && acomp) {
    const cliente = await getClienteContacto(solicitud.clienteId);
    if (cliente.email) {
      emailSolicitudRechazada({
        toEmail: cliente.email,
        clienteNombre: cliente.nombre ?? "Cliente",
        acompananteNombre: acomp.nombrePublico,
      });
    }
  }

  revalidatePath("/acompanante/solicitudes");
}
