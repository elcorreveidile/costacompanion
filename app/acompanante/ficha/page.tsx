import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Acompanante } from '@/types/supabase';
import { FichaAcompananteForm } from './FichaAcompananteForm';

export const metadata = { title: 'Mi ficha | Costa Companion' };

export default async function AcompananteFichaPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data, error } = await supabase
    .from('acompanantes')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  const acompanante = data as unknown as (Acompanante & { slug: string }) | null;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/acompanante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Mi ficha</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            Mi ficha
          </h1>
          {acompanante?.slug && (
            <a
              href={`/${acompanante.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--green)', color: 'var(--green)', background: 'transparent' }}
            >
              Ver mi web pública
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        <p className="text-(--ink)/60 mb-8">
          Esta información es visible en tu microsite público.
        </p>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          {error || !acompanante ? (
            <p className="text-(--ink)/50 text-center py-8">
              No se encontró tu ficha de acompañante. Contacta con el administrador.
            </p>
          ) : (
            <FichaAcompananteForm acompanante={acompanante} />
          )}
        </div>
      </div>
    </div>
  );
}
