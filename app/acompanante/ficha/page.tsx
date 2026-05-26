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

  const acompanante = data as unknown as Acompanante | null;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/acompanante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Mi ficha</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Mi ficha
        </h1>
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
