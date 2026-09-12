import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getReservaResenable, resenaExisteParaReserva } from '@/lib/db/queries/ficha';
import { getI18n } from '@/lib/i18n/server';
import { localePath, type Locale } from '@/lib/i18n/config';
import ResenaForm from './ResenaForm';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reserva_id?: string }>;
}

function ErrorPage({ message, slug, locale, volver }: { message: string; slug: string; locale: Locale; volver: string }) {
  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div
          className="rounded-xl border p-8 text-center shadow-sm"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <p className="text-(--ink)/60 mb-6">{message}</p>
          <a
            href={localePath(locale, `/${slug}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            {volver}
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function ResenaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { reserva_id } = await searchParams;

  const { locale, dict } = await getI18n();
  const tr = dict.flujos.resena;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  if (!reserva_id) {
    return <ErrorPage message={tr.errAccede} slug={slug} locale={locale} volver={dict.flujos.volverAlPerfil} />;
  }

  // La reserva debe ser del usuario y estar completada.
  const reserva = await getReservaResenable(reserva_id, user.id);
  if (!reserva) {
    return (
      <ErrorPage message={tr.errNoReserva} slug={slug} locale={locale} volver={dict.flujos.volverAlPerfil} />
    );
  }

  if (await resenaExisteParaReserva(reserva_id)) {
    return (
      <ErrorPage message={tr.errYaResena} slug={slug} locale={locale} volver={dict.flujos.volverAlPerfil} />
    );
  }

  return (
    <ResenaForm
      reservaId={reserva_id}
      acompananteId={reserva.acompananteId}
      slug={slug}
      locale={locale}
      t={dict.flujos}
      acompananteNombre={reserva.nombrePublico}
    />
  );
}
