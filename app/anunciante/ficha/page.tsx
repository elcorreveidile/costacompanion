import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Anunciante } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FichaAnuncianteForm } from './FichaAnuncianteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi ficha — Local Partner | Costa Companion' };

type RawClient = SupabaseClient;

export default async function AnuncianteFichaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data } = await (admin as RawClient)
    .from('anunciantes')
    .select('descripcion, logo_url, web, telefono, email, whatsapp, nombre_negocio, categoria, zona, plan')
    .eq('profile_id', user.id)
    .single() as { data: Pick<Anunciante, 'descripcion' | 'logo_url' | 'web' | 'telefono' | 'email' | 'whatsapp' | 'nombre_negocio' | 'categoria' | 'zona' | 'plan'> | null };

  if (!data) redirect('/anunciante');

  async function actualizarMiFicha(formData: FormData): Promise<{ error?: string }> {
    'use server';
    const supabase2 = await createClient();
    const { data: { user: u } } = await supabase2.auth.getUser();
    if (!u) return { error: 'No autenticado.' };

    const descripcion = {
      es: (formData.get('descripcion_es') as string | null) ?? '',
      en: (formData.get('descripcion_en') as string | null) ?? '',
    };

    const { error } = await (supabase2 as RawClient)
      .from('anunciantes')
      .update({
        descripcion,
        logo_url:  (formData.get('logo_url') as string | null) || null,
        web:       (formData.get('web') as string | null) || null,
        email:     (formData.get('email') as string | null) || null,
        telefono:  (formData.get('telefono') as string | null) || null,
        whatsapp:  (formData.get('whatsapp') as string | null) || null,
      })
      .eq('profile_id', u.id);

    if (error) return { error: error.message };

    revalidatePath('/anunciante/ficha');
    revalidatePath('/local-partners');
    return {};
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/anunciante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Mi ficha</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-8">Mi ficha</h1>

        <div className="rounded-xl border shadow-sm p-8" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
          <FichaAnuncianteForm anunciante={data} action={actualizarMiFicha} />
        </div>
      </div>
    </div>
  );
}
