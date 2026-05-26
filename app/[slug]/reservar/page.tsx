import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Acompanante, Servicio, Disponibilidad } from '@/types/supabase';
import { ReservarFormClient } from './ReservarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReservarPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Cargar acompañante activo
  const { data: rawAcompanante } = await supabase
    .from('acompanantes')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (!rawAcompanante) notFound();

  const acompanante = rawAcompanante as unknown as Acompanante;

  // Cargar servicios activos
  const { data: serviciosData } = await supabase
    .from('servicios')
    .select('id, titulo, precio, unidad_precio')
    .eq('acompanante_id', acompanante.id)
    .eq('activo', true);

  const serviciosRaw = (serviciosData ?? []) as unknown as Pick<Servicio, 'id' | 'titulo' | 'precio' | 'unidad_precio'>[];

  const servicios = serviciosRaw.map((s) => ({
    id: s.id,
    titulo: ((s.titulo as { es?: string; en?: string }).es ?? 'Servicio'),
    precio: s.precio,
    unidad_precio: s.unidad_precio,
  }));

  // Cargar franjas de disponibilidad abiertas en el futuro
  const now = new Date().toISOString();
  const { data: disponibilidadesData } = await supabase
    .from('disponibilidad')
    .select('id, fecha_hora, duracion_min, modalidad, zona')
    .eq('acompanante_id', acompanante.id)
    .eq('estado', 'abierto')
    .gt('fecha_hora', now)
    .order('fecha_hora', { ascending: true });

  const disponibilidades = (disponibilidadesData ?? []) as unknown as Pick<
    Disponibilidad,
    'id' | 'fecha_hora' | 'duracion_min' | 'modalidad' | 'zona'
  >[];

  return (
    <ReservarFormClient
      slug={slug}
      acompananteId={acompanante.id}
      nombrePublico={acompanante.nombre_publico}
      servicios={servicios}
      disponibilidades={disponibilidades}
    />
  );
}
