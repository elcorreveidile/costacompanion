import { notFound } from 'next/navigation';
import { getAcompananteActivoBySlug } from '@/lib/db/queries/public';
import { SolicitarFormClient } from './SolicitarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SolicitarPage({ params }: PageProps) {
  const { slug } = await params;

  const acompanante = await getAcompananteActivoBySlug(slug);
  if (!acompanante) notFound();

  return (
    <SolicitarFormClient
      slug={slug}
      acompananteId={acompanante.id}
      nombrePublico={acompanante.nombre_publico}
    />
  );
}
