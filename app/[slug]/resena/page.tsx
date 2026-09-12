import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getReservaResenable, resenaExisteParaReserva } from '@/lib/db/queries/ficha';
import ResenaForm from './ResenaForm';

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

  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  if (!reserva_id) {
    return <ErrorPage message="Accede desde Mis reservas" slug={slug} />;
  }

  // La reserva debe ser del usuario y estar completada.
  const reserva = await getReservaResenable(reserva_id, user.id);
  if (!reserva) {
    return (
      <ErrorPage
        message="No tienes una reserva completada que puedas reseñar"
        slug={slug}
      />
    );
  }

  if (await resenaExisteParaReserva(reserva_id)) {
    return (
      <ErrorPage message="Ya has dejado una reseña para esta reserva" slug={slug} />
    );
  }

  return (
    <ResenaForm
      reservaId={reserva_id}
      acompananteId={reserva.acompananteId}
      slug={slug}
      acompananteNombre={reserva.nombrePublico}
    />
  );
}
