import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import ResenaForm from './ResenaForm';

type RawClient = SupabaseClient;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reserva_id?: string }>;
}

function ErrorPage({ message, slug }: { message: string; slug: string }) {
  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div
          className="rounded-xl border p-8 text-center shadow-sm"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <p className="text-(--ink)/60 mb-6">{message}</p>
          <a
            href={`/${slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            Volver al perfil
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function ResenaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { reserva_id } = await searchParams;

  const supabase = await createClient();

  // 1. Get user → redirect if not authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 2. If no reserva_id → show error
  if (!reserva_id) {
    return <ErrorPage message="Accede desde Mis reservas" slug={slug} />;
  }

  // 3. Query reservation: must belong to user, be completada
  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('id, acompanante_id, acompanantes(id, nombre_publico, slug)')
    .eq('id', reserva_id)
    .eq('cliente_id', user.id)
    .eq('estado', 'completada')
    .single() as {
      data: {
        id: string;
        acompanante_id: string;
        acompanantes: { id: string; nombre_publico: string; slug: string } | null;
      } | null;
    };

  if (!reserva) {
    return (
      <ErrorPage
        message="No tienes una reserva completada que puedas reseñar"
        slug={slug}
      />
    );
  }

  // 4. Check no existing review for this reserva_id
  const { data: existing } = await (supabase as RawClient)
    .from('resenas')
    .select('id')
    .eq('reserva_id', reserva_id)
    .maybeSingle();

  if (existing) {
    return (
      <ErrorPage
        message="Ya has dejado una reseña para esta reserva"
        slug={slug}
      />
    );
  }

  // 5. All good — render the form
  const acompanante = reserva.acompanantes;

  return (
    <ResenaForm
      reservaId={reserva.id}
      acompananteId={reserva.acompanante_id}
      slug={slug}
      acompananteNombre={acompanante?.nombre_publico ?? ''}
    />
  );
}
