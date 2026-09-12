import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getAcompananteActivoBySlug } from '@/lib/db/queries/public';
import { getServiciosPublicos, getDisponibilidadFutura } from '@/lib/db/queries/ficha';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';
import { ReservarFormClient } from './ReservarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReservarPage({ params }: PageProps) {
  const { slug } = await params;

  const { locale, dict } = await getI18n();

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, `/auth/login?redirect=/${slug}/reservar`));

  const acompanante = await getAcompananteActivoBySlug(slug);
  if (!acompanante) notFound();

  const serviciosFull = await getServiciosPublicos(acompanante.id);
  const servicios = serviciosFull.map((s) => ({
    id: s.id,
    titulo: pickLang(s.titulo as Record<string, unknown> | null, locale) || dict.flujos.reservar.servicio,
    precio: s.precio,
    unidad_precio: s.unidad_precio,
  }));

  const disponibilidades = await getDisponibilidadFutura(acompanante.id);

  return (
    <ReservarFormClient
      slug={slug}
      locale={locale}
      t={dict.flujos}
      modalidades={dict.common.modalidades}
      acompananteId={acompanante.id}
      nombrePublico={acompanante.nombre_publico}
      servicios={servicios}
      disponibilidades={disponibilidades}
    />
  );
}
