import { and, asc, desc, eq, gte } from "drizzle-orm";
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
import type { DesglosePrecio, ModoGestion } from "@/lib/precios";

/** Estado del cobro de una gestión (enum estado_pago). */
export type EstadoPago =
  | "no_aplica"
  | "pendiente_pago"
  | "pagada"
  | "pendiente_cobro"
  | "cobrada"
  | "reembolsada";

/**
 * Consultas del panel del cliente (owner-scoped por cliente_id) sobre Drizzle.
 */

export interface ReservaCliente {
  id: string;
  fecha_hora: string;
  modalidad: Modalidad;
  zona: string | null;
  estado: EstadoReserva;
  tipo_reserva: "gestion" | "clase" | null;
  modo_gestion: ModoGestion | null;
  metodo_pago: "tarjeta" | "efectivo" | null;
  estado_pago: EstadoPago;
  precio_total_cents: number | null;
  acompanantes: {
    nombre_publico: string;
    slug: string;
    email_contacto: string | null;
    whatsapp: string | null;
  } | null;
  servicios: { titulo: MultilingualText | null } | null;
}

const reservasSelect = {
  id: tReservas.id,
  fechaHora: tReservas.fechaHora,
  modalidad: tReservas.modalidad,
  zona: tReservas.zona,
  estado: tReservas.estado,
  tipoReserva: tReservas.tipoReserva,
  modoGestion: tReservas.modoGestion,
  metodoPago: tReservas.metodoPago,
  estadoPago: tReservas.estadoPago,
  precioTotalCents: tReservas.precioTotalCents,
  acompNombre: tAcomp.nombrePublico,
  acompSlug: tAcomp.slug,
  acompEmail: tAcomp.emailContacto,
  acompWhatsapp: tAcomp.whatsapp,
  servicioTitulo: tServicios.titulo,
};

function mapReservaCliente(r: Awaited<ReturnType<typeof queryReservas>>[number]): ReservaCliente {
  return {
    id: r.id,
    fecha_hora: r.fechaHora.toISOString(),
    modalidad: r.modalidad as Modalidad,
    zona: r.zona,
    estado: r.estado as EstadoReserva,
    tipo_reserva: r.tipoReserva,
    modo_gestion: r.modoGestion,
    metodo_pago: r.metodoPago,
    estado_pago: r.estadoPago as EstadoPago,
    precio_total_cents: r.precioTotalCents,
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
  };
}

function queryReservas() {
  return db
    .select(reservasSelect)
    .from(tReservas)
    .leftJoin(tAcomp, eq(tAcomp.id, tReservas.acompananteId))
    .leftJoin(tServicios, eq(tServicios.id, tReservas.servicioId));
}

export async function getReservasDeCliente(
  clienteId: string
): Promise<ReservaCliente[]> {
  const rows = await queryReservas()
    .where(eq(tReservas.clienteId, clienteId))
    .orderBy(desc(tReservas.createdAt));
  return rows.map(mapReservaCliente);
}

export interface ReservaClienteDetalle extends ReservaCliente {
  idioma_gestion: string | null;
  tipo_gestion_key: string | null;
  precio_desglose: DesglosePrecio | null;
  reembolso_cents: number;
  politica_aplicada:
    | "gratuita"
    | "mitad"
    | "sin_reembolso"
    | "no_show"
    | null;
  no_show: boolean;
  cancelada_motivo: string | null;
  enlace_video: string | null;
}

/** Detalle de una reserva propia (null si no existe o no es del cliente). */
export async function getReservaDetalleCliente(
  clienteId: string,
  reservaId: string
): Promise<ReservaClienteDetalle | null> {
  const row = await queryReservaDetalle()
    .where(and(eq(tReservas.id, reservaId), eq(tReservas.clienteId, clienteId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) return null;

  return {
    ...mapReservaCliente(row),
    idioma_gestion: row.idiomaGestion,
    tipo_gestion_key: row.tipoGestionKey,
    precio_desglose: (row.precioDesglose as DesglosePrecio | null) ?? null,
    reembolso_cents: row.reembolsoCents,
    politica_aplicada: row.politicaAplicada,
    no_show: row.noShow,
    cancelada_motivo: row.canceladaMotivo,
    enlace_video: row.enlaceVideo,
  };
}

const detalleSelect = {
  ...reservasSelect,
  idiomaGestion: tReservas.idiomaGestion,
  tipoGestionKey: tReservas.tipoGestionKey,
  precioDesglose: tReservas.precioDesglose,
  reembolsoCents: tReservas.reembolsoCents,
  politicaAplicada: tReservas.politicaAplicada,
  noShow: tReservas.noShow,
  canceladaMotivo: tReservas.canceladaMotivo,
  enlaceVideo: tReservas.enlaceVideo,
};

function queryReservaDetalle() {
  return db
    .select(detalleSelect)
    .from(tReservas)
    .leftJoin(tAcomp, eq(tAcomp.id, tReservas.acompananteId))
    .leftJoin(tServicios, eq(tServicios.id, tReservas.servicioId));
}

/**
 * La próxima gestión confirmada y futura del cliente (la más cercana).
 * null si no hay ninguna.
 */
export async function getProximaGestion(
  clienteId: string
): Promise<ReservaClienteDetalle | null> {
  const rows = await queryReservaDetalle()
    .where(
      and(
        eq(tReservas.clienteId, clienteId),
        eq(tReservas.tipoReserva, "gestion"),
        eq(tReservas.estado, "confirmada"),
        gte(tReservas.fechaHora, new Date())
      )
    )
    .orderBy(asc(tReservas.fechaHora))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...mapReservaCliente(row),
    idioma_gestion: row.idiomaGestion,
    tipo_gestion_key: row.tipoGestionKey,
    precio_desglose: (row.precioDesglose as DesglosePrecio | null) ?? null,
    reembolso_cents: row.reembolsoCents,
    politica_aplicada: row.politicaAplicada,
    no_show: row.noShow,
    cancelada_motivo: row.canceladaMotivo,
    enlace_video: row.enlaceVideo,
  };
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
