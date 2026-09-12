import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes as tAcompanantes,
  anunciantes as tAnunciantes,
  serviceCategories as tServiceCategories,
  servicios as tServicios,
} from "@/lib/db/schema";
import type {
  Acompanante,
  Anunciante,
  MultilingualText,
  ServiceCategory,
  Modalidad,
  CategoriaAnunciante,
  PlanAnunciante,
  EstadoStripe,
  GrupoCategoria,
} from "@/types/supabase";

/**
 * Consultas públicas (sin autenticación) sobre Neon/Drizzle.
 *
 * Devuelven los tipos de dominio en snake_case (@/types/supabase) para que las
 * páginas apenas cambien respecto a la versión Supabase. Las visibilidades que
 * antes garantizaba la RLS (activo = true, etc.) se aplican aquí explícitamente.
 */

// ── Mappers: fila Drizzle (camelCase) → tipo de dominio (snake_case) ──────────

type AcompananteRow = typeof tAcompanantes.$inferSelect;
type AnuncianteRow = typeof tAnunciantes.$inferSelect;
type ServiceCategoryRow = typeof tServiceCategories.$inferSelect;

function toNum(v: string | null): number | null {
  return v === null ? null : Number(v);
}

function mapAcompanante(r: AcompananteRow): Acompanante {
  return {
    id: r.id,
    profile_id: r.profileId,
    slug: r.slug,
    nombre_publico: r.nombrePublico,
    foto_url: r.fotoUrl,
    bio: (r.bio as MultilingualText | null) ?? null,
    idiomas: r.idiomas ?? [],
    zonas: r.zonas ?? [],
    modalidades: (r.modalidades ?? []) as Modalidad[],
    email_contacto: r.emailContacto,
    whatsapp: r.whatsapp,
    titulacion: r.titulacion,
    interprete_jurado: r.interpreteJurado,
    anios_experiencia: r.aniosExperiencia,
    imparte_clases: r.imparteClases,
    valoracion_media: toNum(r.valoracionMedia),
    num_resenas: r.numResenas,
    activo: r.activo,
    destacado: r.destacado,
    stripe_customer_id: r.stripeCustomerId,
    stripe_subscription_id: r.stripeSubscriptionId,
    stripe_subscription_status: r.stripeSubscriptionStatus as EstadoStripe,
    created_at: r.createdAt.toISOString(),
  };
}

function mapAnunciante(r: AnuncianteRow): Anunciante {
  return {
    id: r.id,
    profile_id: r.profileId,
    nombre_negocio: r.nombreNegocio,
    slug: r.slug,
    categoria: r.categoria as CategoriaAnunciante,
    descripcion: (r.descripcion as MultilingualText | null) ?? null,
    logo_url: r.logoUrl,
    web: r.web,
    telefono: r.telefono,
    email: r.email,
    whatsapp: r.whatsapp,
    zona: r.zona,
    direccion: r.direccion,
    plan: r.plan as PlanAnunciante,
    activo: r.activo,
    stripe_customer_id: r.stripeCustomerId,
    stripe_subscription_id: r.stripeSubscriptionId,
    stripe_subscription_status: r.stripeSubscriptionStatus as EstadoStripe,
    created_at: r.createdAt.toISOString(),
  };
}

function mapServiceCategory(r: ServiceCategoryRow): ServiceCategory {
  return {
    id: r.id,
    key: r.key,
    grupo: r.grupo as GrupoCategoria,
    nombre: (r.nombre as MultilingualText) ?? {},
    created_at: r.createdAt.toISOString(),
  };
}

// ── Acompañantes ──────────────────────────────────────────────────────────────

export async function getAcompananteActivoBySlug(
  slug: string
): Promise<Acompanante | null> {
  const rows = await db
    .select()
    .from(tAcompanantes)
    .where(and(eq(tAcompanantes.slug, slug), eq(tAcompanantes.activo, true)))
    .limit(1);
  return rows[0] ? mapAcompanante(rows[0]) : null;
}

export interface DirectorioFiltros {
  idioma?: string;
  zona?: string;
  modalidad?: string;
}

export async function listAcompanantesActivos(
  filtros: DirectorioFiltros = {}
): Promise<Acompanante[]> {
  const condiciones = [eq(tAcompanantes.activo, true)];
  if (filtros.idioma) {
    condiciones.push(sql`${tAcompanantes.idiomas} @> ARRAY[${filtros.idioma}]`);
  }
  if (filtros.zona) {
    condiciones.push(sql`${tAcompanantes.zonas} @> ARRAY[${filtros.zona}]`);
  }
  if (filtros.modalidad) {
    condiciones.push(
      sql`${tAcompanantes.modalidades} @> ARRAY[${filtros.modalidad}]::modalidad_servicio[]`
    );
  }

  const rows = await db
    .select()
    .from(tAcompanantes)
    .where(and(...condiciones))
    .orderBy(
      desc(tAcompanantes.destacado),
      sql`${tAcompanantes.valoracionMedia} DESC NULLS LAST`
    );
  return rows.map(mapAcompanante);
}

/**
 * De un conjunto de ids de acompañante, devuelve los que ofrecen al menos un
 * servicio activo en la categoría dada. Equivale al filtro por categoría del
 * directorio (que en Supabase se hacía con una segunda consulta).
 */
export async function filtrarAcompananteIdsPorCategoria(
  ids: string[],
  categoriaId: string
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ acompananteId: tServicios.acompananteId })
    .from(tServicios)
    .where(
      and(
        eq(tServicios.categoria, categoriaId),
        eq(tServicios.activo, true),
        inArray(tServicios.acompananteId, ids)
      )
    );
  return new Set(rows.map((r) => r.acompananteId));
}

// ── Categorías de servicio ────────────────────────────────────────────────────

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const rows = await db
    .select()
    .from(tServiceCategories)
    .orderBy(tServiceCategories.grupo);
  return rows.map(mapServiceCategory);
}

// ── Anunciantes (Local Partners) ──────────────────────────────────────────────

export async function getAnuncianteActivoBySlug(
  slug: string
): Promise<Anunciante | null> {
  const rows = await db
    .select()
    .from(tAnunciantes)
    .where(and(eq(tAnunciantes.slug, slug), eq(tAnunciantes.activo, true)))
    .limit(1);
  return rows[0] ? mapAnunciante(rows[0]) : null;
}

export interface LocalPartnersFiltros {
  categoria?: string;
  zona?: string;
}

export async function listAnunciantesActivos(
  filtros: LocalPartnersFiltros = {}
): Promise<Anunciante[]> {
  const condiciones = [eq(tAnunciantes.activo, true)];
  if (filtros.categoria) {
    condiciones.push(
      eq(tAnunciantes.categoria, filtros.categoria as CategoriaAnunciante)
    );
  }
  if (filtros.zona) {
    condiciones.push(eq(tAnunciantes.zona, filtros.zona));
  }
  const rows = await db
    .select()
    .from(tAnunciantes)
    .where(and(...condiciones));
  return rows.map(mapAnunciante);
}

export async function listAnunciantesDestacados(
  limite = 3
): Promise<Anunciante[]> {
  const rows = await db
    .select()
    .from(tAnunciantes)
    .where(
      and(eq(tAnunciantes.activo, true), eq(tAnunciantes.plan, "destacado"))
    )
    .limit(limite);
  return rows.map(mapAnunciante);
}
