import { notFound } from 'next/navigation';
import { getAcompananteActivoBySlug } from '@/lib/db/queries/public';
import { getI18n } from '@/lib/i18n/server';
import { SolicitarFormClient } from './SolicitarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SolicitarPage({ params }: PageProps) {
  const { slug } = await params;

  const { locale, dict } = await getI18n();

  const acompanante = await getAcompananteActivoBySlug(slug);
  if (!acompanante) notFound();

  return (
    <SolicitarFormClient
      slug={slug}
      locale={locale}
      t={dict.flujos}
      modalidades={dict.common.modalidades}
      acompananteId={acompanante.id}
      nombrePublico={acompanante.nombre_publico}
    />
  );
}
