import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getAcompananteActivoBySlug } from '@/lib/db/queries/public';
import { getServiciosPublicos, getDisponibilidadFutura } from '@/lib/db/queries/ficha';
import { ReservarFormClient } from './ReservarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReservarPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?redirect=/${slug}/reservar`);

  const acompanante = await getAcompananteActivoBySlug(slug);
  if (!acompanante) notFound();

  const serviciosFull = await getServiciosPublicos(acompanante.id);
  const servicios = serviciosFull.map((s) => ({
    id: s.id,
    titulo: (s.titulo as { es?: string }).es ?? 'Servicio',
    precio: s.precio,
    unidad_precio: s.unidad_precio,
  }));

  const disponibilidades = await getDisponibilidadFutura(acompanante.id);

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
