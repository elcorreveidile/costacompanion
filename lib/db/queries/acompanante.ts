import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes,
  profiles,
  reservas as tReservas,
  solicitudes as tSolicitudes,
  servicios as tServicios,
  paquetesClases as tPaquetes,
  disponibilidad as tDisp,
} from "@/lib/db/schema";
import type {
  Servicio,
  PaqueteClases,
  Disponibilidad,
  MultilingualText,
  Modalidad,
  UnidadPrecio,
  EstadoDisponibilidad,
  EstadoReserva,
  EstadoSolicitud,
} from "@/types/supabase";

/**
 * Consultas del panel del acompañante (owner-scoped) sobre Drizzle.
 * Devuelven los tipos de dominio (snake_case) que esperan los componentes.
 */

export interface ServicioConPaquetes extends Servicio {
  paquetes_clases: PaqueteClases[];
}

export async function getMiAcompananteId(
  profileId: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: acompanantes.id })
    .from(acompanantes)
    .where(eq(acompanantes.profileId, profileId))
    .limit(1);
  return row?.id ?? null;
}

function mapServicio(r: typeof tServicios.$inferSelect): Servicio {
  return {
    id: r.id,
    acompanante_id: r.acompananteId,
    categoria: r.categoria,
    titulo: (r.titulo as MultilingualText) ?? {},
    descripcion: (r.descripcion as MultilingualText | null) ?? null,
    modalidad: r.modalidad as Modalidad,
    precio: Number(r.precio),
    unidad_precio: r.unidadPrecio as UnidadPrecio,
    es_clase: r.esClase,
    activo: r.activo,
    created_at: r.createdAt.toISOString(),
  };
}

function mapPaquete(r: typeof tPaquetes.$inferSelect): PaqueteClases {
  return {
    id: r.id,
    servicio_id: r.servicioId,
    num_sesiones: r.numSesiones,
    precio_total: Number(r.precioTotal),
    activo: r.activo,
  };
}

function mapDisponibilidad(r: typeof tDisp.$inferSelect): Disponibilidad {
  return {
    id: r.id,
    acompanante_id: r.acompananteId,
    fecha_hora: r.fechaHora.toISOString(),
    duracion_min: r.duracionMin,
    modalidad: r.modalidad as Modalidad,
    zona: r.zona,
    estado: r.estado as EstadoDisponibilidad,
    created_at: r.createdAt.toISOString(),
  };
}

export async function getServiciosConPaquetes(
  acompananteId: string
): Promise<ServicioConPaquetes[]> {
  const servs = await db
    .select()
    .from(tServicios)
    .where(eq(tServicios.acompananteId, acompananteId))
    .orderBy(desc(tServicios.createdAt));
  if (servs.length === 0) return [];

  const paqs = await db
    .select()
    .from(tPaquetes)
    .where(inArray(tPaquetes.servicioId, servs.map((s) => s.id)));

  const porServicio = new Map<string, PaqueteClases[]>();
  for (const p of paqs) {
    const arr = porServicio.get(p.servicioId) ?? [];
    arr.push(mapPaquete(p));
    porServicio.set(p.servicioId, arr);
  }

  return servs.map((s) => ({
    ...mapServicio(s),
    paquetes_clases: porServicio.get(s.id) ?? [],
  }));
}

export async function getDisponibilidadDe(
  acompananteId: string
): Promise<Disponibilidad[]> {
  const rows = await db
    .select()
    .from(tDisp)
    .where(eq(tDisp.acompananteId, acompananteId))
    .orderBy(asc(tDisp.fechaHora));
  return rows.map(mapDisponibilidad);
}

export interface ReservaAcompanante {
  id: string;
  fecha_hora: string;
  modalidad: Modalidad;
  zona: string | null;
  estado: EstadoReserva;
  profiles: { nombre: string | null } | null;
  servicios: { titulo: MultilingualText | null } | null;
}

export async function getReservasDeAcompanante(
  acompananteId: string
): Promise<ReservaAcompanante[]> {
  const rows = await db
    .select({
      id: tReservas.id,
      fechaHora: tReservas.fechaHora,
      modalidad: tReservas.modalidad,
      zona: tReservas.zona,
      estado: tReservas.estado,
      clienteNombre: profiles.nombre,
      servicioTitulo: tServicios.titulo,
    })
    .from(tReservas)
    .leftJoin(profiles, eq(profiles.id, tReservas.clienteId))
    .leftJoin(tServicios, eq(tServicios.id, tReservas.servicioId))
    .where(eq(tReservas.acompananteId, acompananteId))
    .orderBy(desc(tReservas.createdAt));

  return rows.map((r) => ({
    id: r.id,
    fecha_hora: r.fechaHora.toISOString(),
    modalidad: r.modalidad as Modalidad,
    zona: r.zona,
    estado: r.estado as EstadoReserva,
    profiles: { nombre: r.clienteNombre ?? null },
    servicios: r.servicioTitulo
      ? { titulo: r.servicioTitulo as MultilingualText }
      : null,
  }));
}

export interface SolicitudAcompanante {
  id: string;
  descripcion: string;
  detalle_servicio: string | null;
  fecha_hora_deseada: string | null;
  modalidad: Modalidad;
  zona: string | null;
  precio_propuesto: number | null;
  estado: EstadoSolicitud;
  created_at: string;
  profiles: { nombre: string | null } | null;
}

export async function getSolicitudesDeAcompanante(
  acompananteId: string
): Promise<SolicitudAcompanante[]> {
  const rows = await db
    .select({
      id: tSolicitudes.id,
      descripcion: tSolicitudes.descripcion,
      detalleServicio: tSolicitudes.detalleServicio,
      fechaHoraDeseada: tSolicitudes.fechaHoraDeseada,
      modalidad: tSolicitudes.modalidad,
      zona: tSolicitudes.zona,
      precioPropuesto: tSolicitudes.precioPropuesto,
      estado: tSolicitudes.estado,
      createdAt: tSolicitudes.createdAt,
      clienteNombre: profiles.nombre,
    })
    .from(tSolicitudes)
    .leftJoin(profiles, eq(profiles.id, tSolicitudes.clienteId))
    .where(eq(tSolicitudes.acompananteId, acompananteId))
    .orderBy(desc(tSolicitudes.createdAt));

  return rows.map((r) => ({
    id: r.id,
    descripcion: r.descripcion,
    detalle_servicio: r.detalleServicio,
    fecha_hora_deseada: r.fechaHoraDeseada ? r.fechaHoraDeseada.toISOString() : null,
    modalidad: r.modalidad as Modalidad,
    zona: r.zona,
    precio_propuesto: r.precioPropuesto === null ? null : Number(r.precioPropuesto),
    estado: r.estado as EstadoSolicitud,
    created_at: r.createdAt.toISOString(),
    profiles: { nombre: r.clienteNombre ?? null },
  }));
}
