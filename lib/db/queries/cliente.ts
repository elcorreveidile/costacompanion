import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  reservas as tReservas,
  solicitudes as tSolicitudes,
  servicios as tServicios,
  acompanantes as tAcomp,
  resenas as tResenas,
} from "@/lib/db/schema";
import type {
  EstadoReserva,
  EstadoSolicitud,
  Modalidad,
  MultilingualText,
} from "@/types/supabase";

/**
 * Consultas del panel del cliente (owner-scoped por cliente_id) sobre Drizzle.
 */

export interface ReservaCliente {
  id: string;
  fecha_hora: string;
  modalidad: Modalidad;
  zona: string | null;
  estado: EstadoReserva;
  acompanantes: {
    nombre_publico: string;
    slug: string;
    email_contacto: string | null;
    whatsapp: string | null;
  } | null;
  servicios: { titulo: MultilingualText | null } | null;
}

export async function getReservasDeCliente(
  clienteId: string
): Promise<ReservaCliente[]> {
  const rows = await db
    .select({
      id: tReservas.id,
      fechaHora: tReservas.fechaHora,
      modalidad: tReservas.modalidad,
      zona: tReservas.zona,
      estado: tReservas.estado,
      acompNombre: tAcomp.nombrePublico,
      acompSlug: tAcomp.slug,
      acompEmail: tAcomp.emailContacto,
      acompWhatsapp: tAcomp.whatsapp,
      servicioTitulo: tServicios.titulo,
    })
    .from(tReservas)
    .leftJoin(tAcomp, eq(tAcomp.id, tReservas.acompananteId))
    .leftJoin(tServicios, eq(tServicios.id, tReservas.servicioId))
    .where(eq(tReservas.clienteId, clienteId))
    .orderBy(desc(tReservas.createdAt));

  return rows.map((r) => ({
    id: r.id,
    fecha_hora: r.fechaHora.toISOString(),
    modalidad: r.modalidad as Modalidad,
    zona: r.zona,
    estado: r.estado as EstadoReserva,
    acompanantes: r.acompSlug
      ? {
          nombre_publico: r.acompNombre ?? "",
          slug: r.acompSlug,
          email_contacto: r.acompEmail,
          whatsapp: r.acompWhatsapp,
        }
      : null,
    servicios: r.servicioTitulo
      ? { titulo: r.servicioTitulo as MultilingualText }
      : null,
  }));
}

export async function getReservaIdsResenadas(
  clienteId: string
): Promise<Set<string>> {
  const rows = await db
    .select({ reservaId: tResenas.reservaId })
    .from(tResenas)
    .where(eq(tResenas.clienteId, clienteId));
  return new Set(
    rows.map((r) => r.reservaId).filter((id): id is string => id !== null)
  );
}

export interface SolicitudCliente {
  id: string;
  descripcion: string;
  fecha_hora_deseada: string | null;
  modalidad: Modalidad;
  zona: string | null;
  precio_propuesto: number | null;
  estado: EstadoSolicitud;
  acompanantes: { nombre_publico: string; slug: string } | null;
}

export async function getSolicitudesDeCliente(
  clienteId: string
): Promise<SolicitudCliente[]> {
  const rows = await db
    .select({
      id: tSolicitudes.id,
      descripcion: tSolicitudes.descripcion,
      fechaHoraDeseada: tSolicitudes.fechaHoraDeseada,
      modalidad: tSolicitudes.modalidad,
      zona: tSolicitudes.zona,
      precioPropuesto: tSolicitudes.precioPropuesto,
      estado: tSolicitudes.estado,
      acompNombre: tAcomp.nombrePublico,
      acompSlug: tAcomp.slug,
    })
    .from(tSolicitudes)
    .leftJoin(tAcomp, eq(tAcomp.id, tSolicitudes.acompananteId))
    .where(eq(tSolicitudes.clienteId, clienteId))
    .orderBy(desc(tSolicitudes.createdAt));

  return rows.map((r) => ({
    id: r.id,
    descripcion: r.descripcion,
    fecha_hora_deseada: r.fechaHoraDeseada ? r.fechaHoraDeseada.toISOString() : null,
    modalidad: r.modalidad as Modalidad,
    zona: r.zona,
    precio_propuesto: r.precioPropuesto === null ? null : Number(r.precioPropuesto),
    estado: r.estado as EstadoSolicitud,
    acompanantes: r.acompSlug
      ? { nombre_publico: r.acompNombre ?? "", slug: r.acompSlug }
      : null,
  }));
}
