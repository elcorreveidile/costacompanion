import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  servicios as tServicios,
  paquetesClases as tPaquetes,
  serviceCategories as tCats,
  resenas as tResenas,
  reservas as tReservas,
  profiles,
} from "@/lib/db/schema";
import type {
  Servicio,
  PaqueteClases,
  Resena,
  MultilingualText,
  Modalidad,
  UnidadPrecio,
} from "@/types/supabase";

/** Consultas de la ficha pública del acompañante (app/[slug]). */

export interface ServicioPublico extends Servicio {
  paquetes_clases: PaqueteClases[];
  service_categories: { key: string; nombre: MultilingualText } | null;
}

export interface ResenaPublica extends Resena {
  profiles: { id: string; nombre: string | null } | null;
}

export async function getServiciosPublicos(
  acompananteId: string
): Promise<ServicioPublico[]> {
  const servs = await db
    .select({
      id: tServicios.id,
      acompananteId: tServicios.acompananteId,
      categoria: tServicios.categoria,
      titulo: tServicios.titulo,
      descripcion: tServicios.descripcion,
      modalidad: tServicios.modalidad,
      precio: tServicios.precio,
      unidadPrecio: tServicios.unidadPrecio,
      esClase: tServicios.esClase,
      activo: tServicios.activo,
      createdAt: tServicios.createdAt,
      catKey: tCats.key,
      catNombre: tCats.nombre,
    })
    .from(tServicios)
    .leftJoin(tCats, eq(tCats.id, tServicios.categoria))
    .where(and(eq(tServicios.acompananteId, acompananteId), eq(tServicios.activo, true)));
  if (servs.length === 0) return [];

  const paqs = await db
    .select()
    .from(tPaquetes)
    .where(inArray(tPaquetes.servicioId, servs.map((s) => s.id)));
  const byServ = new Map<string, PaqueteClases[]>();
  for (const p of paqs) {
    const arr = byServ.get(p.servicioId) ?? [];
    arr.push({
      id: p.id,
      servicio_id: p.servicioId,
      num_sesiones: p.numSesiones,
      precio_total: Number(p.precioTotal),
      activo: p.activo,
    });
    byServ.set(p.servicioId, arr);
  }

  return servs.map((s) => ({
    id: s.id,
    acompanante_id: s.acompananteId,
    categoria: s.categoria,
    titulo: (s.titulo as MultilingualText) ?? {},
    descripcion: (s.descripcion as MultilingualText | null) ?? null,
    modalidad: s.modalidad as Modalidad,
    precio: Number(s.precio),
    unidad_precio: s.unidadPrecio as UnidadPrecio,
    es_clase: s.esClase,
    activo: s.activo,
    created_at: s.createdAt.toISOString(),
    paquetes_clases: byServ.get(s.id) ?? [],
    service_categories: s.catKey
      ? { key: s.catKey, nombre: (s.catNombre as MultilingualText) ?? {} }
      : null,
  }));
}

export async function getResenasAprobadas(
  acompananteId: string
): Promise<ResenaPublica[]> {
  const rows = await db
    .select({
      id: tResenas.id,
      acompananteId: tResenas.acompananteId,
      clienteId: tResenas.clienteId,
      reservaId: tResenas.reservaId,
      puntuacion: tResenas.puntuacion,
      comentario: tResenas.comentario,
      aprobada: tResenas.aprobada,
      createdAt: tResenas.createdAt,
      nombre: profiles.nombre,
    })
    .from(tResenas)
    .leftJoin(profiles, eq(profiles.id, tResenas.clienteId))
    .where(and(eq(tResenas.acompananteId, acompananteId), eq(tResenas.aprobada, true)))
    .orderBy(desc(tResenas.createdAt));

  return rows.map((r) => ({
    id: r.id,
    acompanante_id: r.acompananteId,
    cliente_id: r.clienteId,
    reserva_id: r.reservaId,
    puntuacion: r.puntuacion,
    comentario: r.comentario,
    aprobada: r.aprobada,
    created_at: r.createdAt.toISOString(),
    profiles: { id: r.clienteId, nombre: r.nombre ?? null },
  }));
}

export async function clienteTieneResenaDe(
  acompananteId: string,
  clienteId: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: tResenas.id })
    .from(tResenas)
    .where(and(eq(tResenas.acompananteId, acompananteId), eq(tResenas.clienteId, clienteId)))
    .limit(1);
  return !!row;
}

export async function reservaCompletadaSinResena(
  acompananteId: string,
  clienteId: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: tReservas.id })
    .from(tReservas)
    .where(
      and(
        eq(tReservas.acompananteId, acompananteId),
        eq(tReservas.clienteId, clienteId),
        eq(tReservas.estado, "completada")
      )
    )
    .orderBy(desc(tReservas.createdAt))
    .limit(1);
  return row?.id ?? null;
}
