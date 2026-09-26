import { and, asc, desc, eq, gte, inArray, isNull, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes,
  documentos as tDocumentos,
  estadoPago,
  profiles,
  reservas as tReservas,
  solicitudes as tSolicitudes,
  servicios as tServicios,
  paquetesClases as tPaquetes,
  disponibilidad as tDisp,
} from "@/lib/db/schema";
import { limitesDiaMadrid, horaMadrid } from "@/lib/tiempo";
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
  enlace_video: string | null;
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
      enlaceVideo: tReservas.enlaceVideo,
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
    enlace_video: r.enlaceVideo ?? null,
    profiles: { nombre: r.clienteNombre ?? null },
    servicios: r.servicioTitulo
      ? { titulo: r.servicioTitulo as MultilingualText }
      : null,
  }));
}

/** Ítem de la agenda del día del acompañante. */
export interface AgendaItem {
  id: string;
  fecha_hora: string;
  hora_madrid: string;
  estado: EstadoReserva;
  modalidad: Modalidad;
  zona: string | null;
  tipo_reserva: "gestion" | "clase" | null;
  modo_gestion: string | null;
  idioma_gestion: string | null;
  detalle_servicio: string | null;
  metodo_pago: "tarjeta" | "efectivo" | null;
  estado_pago: (typeof estadoPago.enumValues)[number];
  precio_total_cents: number | null;
  enlace_video: string | null;
  notas_acompanante: string | null;
  cliente: { nombre: string | null; idioma: string | null } | null;
  servicios: { titulo: MultilingualText | null } | null;
}

/**
 * Agenda de un día natural de Madrid (DST-safe: extremos con fromZonedTime).
 * Orden «ruta del día»: municipio alfabético primero, hora después
 * (las remotas, sin municipio, al final por hora).
 */
export async function getAgendaDelDia(
  acompananteId: string,
  fechaMadridISO: string
): Promise<AgendaItem[]> {
  const { desde, hasta } = limitesDiaMadrid(fechaMadridISO);
  const rows = await db
    .select({
      id: tReservas.id,
      fechaHora: tReservas.fechaHora,
      estado: tReservas.estado,
      modalidad: tReservas.modalidad,
      zona: tReservas.zona,
      tipoReserva: tReservas.tipoReserva,
      modoGestion: tReservas.modoGestion,
      idiomaGestion: tReservas.idiomaGestion,
      detalleServicio: tReservas.detalleServicio,
      metodoPago: tReservas.metodoPago,
      estadoPago: tReservas.estadoPago,
      precioTotalCents: tReservas.precioTotalCents,
      enlaceVideo: tReservas.enlaceVideo,
      notasAcompanante: tReservas.notasAcompanante,
      clienteNombre: profiles.nombre,
      clienteIdioma: profiles.idiomaPreferido,
      servicioTitulo: tServicios.titulo,
    })
    .from(tReservas)
    .leftJoin(profiles, eq(profiles.id, tReservas.clienteId))
    .leftJoin(tServicios, eq(tServicios.id, tReservas.servicioId))
    .where(
      and(
        eq(tReservas.acompananteId, acompananteId),
        gte(tReservas.fechaHora, desde),
        lt(tReservas.fechaHora, hasta),
        ne(tReservas.estado, "pendiente")
      )
    );

  return rows
    .map((r) => ({
      id: r.id,
      fecha_hora: r.fechaHora.toISOString(),
      hora_madrid: horaMadrid(r.fechaHora),
      estado: r.estado as EstadoReserva,
      modalidad: r.modalidad as Modalidad,
      zona: r.zona,
      tipo_reserva: r.tipoReserva,
      modo_gestion: r.modoGestion,
      idioma_gestion: r.idiomaGestion,
      detalle_servicio: r.detalleServicio,
      metodo_pago: r.metodoPago,
      estado_pago: r.estadoPago ?? "no_aplica",
      precio_total_cents: r.precioTotalCents,
      enlace_video: r.enlaceVideo,
      notas_acompanante: r.notasAcompanante,
      cliente: r.clienteNombre
        ? { nombre: r.clienteNombre, idioma: r.clienteIdioma }
        : null,
      servicios: r.servicioTitulo
        ? { titulo: r.servicioTitulo as MultilingualText }
        : null,
    }))
    .sort((a, b) => {
      const za = a.zona ?? "\uffff"; // remota (sin zona) al final
      const zb = b.zona ?? "\uffff";
      if (za !== zb) return za.localeCompare(zb);
      return a.fecha_hora.localeCompare(b.fecha_hora);
    });
}

/** Documentos (id + nombre) de las reservas indicadas, para lectura en agenda. */
export async function getDocumentosDeReservas(
  acompananteId: string,
  reservaIds: string[]
): Promise<Map<string, { id: string; nombre: string }[]>> {
  if (reservaIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: tDocumentos.id,
      reservaId: tDocumentos.reservaId,
      nombre: tDocumentos.nombreOriginal,
    })
    .from(tDocumentos)
    .where(
      and(
        eq(tDocumentos.acompananteId, acompananteId),
        inArray(tDocumentos.reservaId, reservaIds),
        isNull(tDocumentos.eliminadoAt)
      )
    )
    .orderBy(asc(tDocumentos.createdAt));

  const mapa = new Map<string, { id: string; nombre: string }[]>();
  for (const d of rows) {
    const lista = mapa.get(d.reservaId) ?? [];
    lista.push({ id: d.id, nombre: d.nombre });
    mapa.set(d.reservaId, lista);
  }
  return mapa;
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
