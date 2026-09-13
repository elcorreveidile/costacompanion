import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { anunciantes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import type { MultilingualText } from '@/types/supabase';
import { getI18n } from '@/lib/i18n/server';
import { localePath, locales } from '@/lib/i18n/config';
import { FichaAnuncianteForm } from './FichaAnuncianteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi ficha — Local Partner | Costa Companion' };

export default async function AnuncianteFichaPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelAnunciante.ficha;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const [row] = await db
    .select({
      descripcion: anunciantes.descripcion,
      logo_url: anunciantes.logoUrl,
      web: anunciantes.web,
      telefono: anunciantes.telefono,
      email: anunciantes.email,
      whatsapp: anunciantes.whatsapp,
      nombre_negocio: anunciantes.nombreNegocio,
      categoria: anunciantes.categoria,
      zona: anunciantes.zona,
      plan: anunciantes.plan,
      direccion: anunciantes.direccion,
    })
    .from(anunciantes)
    .where(eq(anunciantes.profileId, user.id))
    .limit(1);

  if (!row) redirect(localePath(locale, '/anunciante'));

  const data = {
    ...row,
    descripcion: (row.descripcion as MultilingualText | null) ?? null,
  };

  async function actualizarMiFicha(formData: FormData): Promise<{ error?: string }> {
    'use server';
    const u = await getSessionUser();
    if (!u) return { error: t.noAutenticado };

    const descripcion: Record<string, string> = {};
    for (const code of locales) {
      const v = ((formData.get(`descripcion_${code}`) as string | null) ?? '').trim();
      if (v) descripcion[code] = v;
    }

    try {
      await db
        .update(anunciantes)
        .set({
          descripcion,
          logoUrl: (formData.get('logo_url') as string | null) || null,
          web: (formData.get('web') as string | null) || null,
          email: (formData.get('email') as string | null) || null,
          telefono: (formData.get('telefono') as string | null) || null,
          whatsapp: (formData.get('whatsapp') as string | null) || null,
          direccion: (formData.get('direccion') as string | null) || null,
        })
        .where(eq(anunciantes.profileId, u.id));
    } catch (e) {
      console.error('actualizarMiFicha (anunciante):', e);
      return { error: t.errorActualizar };
    }

    revalidatePath('/anunciante/ficha');
    revalidatePath('/local-partners');
    return {};
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, "/anunciante")} className="hover:text-(--ink) transition-colors">{t.breadcrumbPanel}</a>
          <span>›</span>
          <span className="text-(--ink)/80">{t.breadcrumb}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-8">{t.h1}</h1>

        <div className="rounded-xl border shadow-sm p-8" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
          <FichaAnuncianteForm anunciante={data} action={actualizarMiFicha} t={t} locale={locale} />
        </div>
      </div>
    </div>
  );
}
