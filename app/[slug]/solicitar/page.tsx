import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Acompanante } from '@/types/supabase';
import { SolicitarFormClient } from './SolicitarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SolicitarPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: rawAcompanante } = await supabase
    .from('acompanantes')
    .select('id, nombre_publico')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (!rawAcompanante) notFound();

  const acompanante = rawAcompanante as unknown as Pick<Acompanante, 'id' | 'nombre_publico'>;

  return (
    <SolicitarFormClient
      slug={slug}
      acompananteId={acompanante.id}
      nombrePublico={acompanante.nombre_publico}
    />
  );
}
