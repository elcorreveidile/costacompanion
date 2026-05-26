import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Servicio, PaqueteClases, ServiceCategory } from '@/types/supabase';
import { ServiciosManager } from './ServiciosManager';

export const metadata = { title: 'Mis servicios | Costa Companion' };

interface ServicioConPaquetes extends Servicio {
  paquetes_clases: PaqueteClases[];
}

export default async function AcompananteServiciosPage() {
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

  const [serviciosRes, categoriasRes] = await Promise.all([
    acompananteId
      ? supabase
          .from('servicios')
          .select('*, paquetes_clases(*)')
          .eq('acompanante_id', acompananteId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from('service_categories').select('*').order('grupo'),
  ]);

  const servicios = (serviciosRes.data ?? []) as unknown as ServicioConPaquetes[];
  const categorias = (categoriasRes.data ?? []) as unknown as ServiceCategory[];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/acompanante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Mis servicios</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Mis servicios
        </h1>
        <p className="text-(--ink)/60 mb-8">
          Gestiona los servicios que ofreces a tus clientes.
        </p>

        {!acompananteId ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50">No se encontró tu ficha de acompañante.</p>
          </div>
        ) : (
          <ServiciosManager
            servicios={servicios}
            categorias={categorias}
            acompananteId={acompananteId}
          />
        )}
      </div>
    </div>
  );
}
