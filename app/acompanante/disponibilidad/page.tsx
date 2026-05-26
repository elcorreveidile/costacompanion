import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Disponibilidad } from '@/types/supabase';
import { DisponibilidadManager } from './DisponibilidadManager';

export const metadata = { title: 'Disponibilidad | Costa Companion' };

export default async function AcompananteDisponibilidadPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Obtener acompanante_id
  const { data: acompananteData } = await supabase
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single() as { data: { id: string } | null; error: null };

  const acompananteId = acompananteData?.id ?? null;

  const { data: franjas } = acompananteId
    ? await supabase
        .from('disponibilidad')
        .select('*')
        .eq('acompanante_id', acompananteId)
        .order('fecha_hora', { ascending: true })
    : { data: [] };

  const lista = (franjas ?? []) as unknown as Disponibilidad[];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/acompanante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Disponibilidad</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Mi disponibilidad
        </h1>
        <p className="text-(--ink)/60 mb-8">
          Publica tus franjas horarias para que los clientes puedan solicitar cita.
        </p>

        {!acompananteId ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50">No se encontró tu ficha de acompañante.</p>
          </div>
        ) : (
          <DisponibilidadManager franjas={lista} />
        )}
      </div>
    </div>
  );
}
