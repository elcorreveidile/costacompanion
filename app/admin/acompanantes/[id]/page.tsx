import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { acompanantes } from '@/lib/db/schema';
import type { Acompanante, MultilingualText } from '@/types/supabase';
import { FichaAdminForm } from './FichaAdminForm';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminAcompananteEditPage({ params }: PageProps) {
  const { id } = await params;
  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin;

  const [row] = await db
    .select()
    .from(acompanantes)
    .where(eq(acompanantes.id, id))
    .limit(1);

  if (!row) notFound();

  const acompanante: Acompanante = {
    id: row.id,
    profile_id: row.profileId,
    slug: row.slug,
    nombre_publico: row.nombrePublico,
    foto_url: row.fotoUrl,
    bio: (row.bio as MultilingualText | null) ?? null,
    idiomas: row.idiomas ?? [],
    zonas: row.zonas ?? [],
    modalidades: (row.modalidades ?? []) as Acompanante['modalidades'],
    email_contacto: row.emailContacto,
    whatsapp: row.whatsapp,
    titulacion: row.titulacion,
    interprete_jurado: row.interpreteJurado,
    anios_experiencia: row.aniosExperiencia,
    imparte_clases: row.imparteClases,
    valoracion_media: row.valoracionMedia === null ? null : Number(row.valoracionMedia),
    num_resenas: row.numResenas,
    activo: row.activo,
    destacado: row.destacado,
    stripe_customer_id: row.stripeCustomerId,
    stripe_subscription_id: row.stripeSubscriptionId,
    stripe_subscription_status: row.stripeSubscriptionStatus,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, "/admin")} className="hover:text-(--ink) transition-colors">{t.shared.admin}</a>
          <span>›</span>
          <a href={localePath(locale, "/admin/acompanantes")} className="hover:text-(--ink) transition-colors">{t.acompanantes.breadcrumb}</a>
          <span>›</span>
          <span className="text-(--ink)/80">{acompanante.nombre_publico}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-(--green)">
              {acompanante.nombre_publico}
            </h1>
            <p className="text-(--ink)/50 text-sm mt-1 font-mono">{acompanante.slug}</p>
          </div>
          <a
            href={localePath(locale, `/${acompanante.slug}`)}
            className="text-sm text-(--green) hover:opacity-70 transition-opacity mt-1"
          >
            {t.acompanantes.verMicrosite}
          </a>
        </div>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <FichaAdminForm acompanante={acompanante} t={t.acompanantes.form} shared={t.shared} modalidades={dict.common.modalidades} fotoT={dict.panelAcompanante.ficha.foto} locale={locale} />
        </div>
      </div>
    </div>
  );
}
