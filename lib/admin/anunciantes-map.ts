import type { InferSelectModel } from 'drizzle-orm';
import type { anunciantes } from '@/lib/db/schema';
import type { Anunciante, MultilingualText } from '@/types/supabase';

type AnuncianteRow = InferSelectModel<typeof anunciantes>;

/** Convierte una fila de Drizzle (camelCase) al tipo Anunciante (snake_case). */
export function rowToAnunciante(row: AnuncianteRow): Anunciante {
  return {
    id: row.id,
    profile_id: row.profileId,
    nombre_negocio: row.nombreNegocio,
    slug: row.slug,
    categoria: row.categoria,
    descripcion: (row.descripcion as MultilingualText | null) ?? null,
    logo_url: row.logoUrl,
    web: row.web,
    telefono: row.telefono,
    email: row.email,
    whatsapp: row.whatsapp,
    zona: row.zona,
    direccion: row.direccion,
    plan: row.plan,
    activo: row.activo,
    stripe_customer_id: row.stripeCustomerId,
    stripe_subscription_id: row.stripeSubscriptionId,
    stripe_subscription_status: row.stripeSubscriptionStatus,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}
