import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getMiAcompananteId, getDisponibilidadDe } from '@/lib/db/queries/acompanante';
import { DisponibilidadManager } from './DisponibilidadManager';

export const metadata = { title: 'Disponibilidad | Costa Companion' };

export default async function AcompananteDisponibilidadPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const acompananteId = await getMiAcompananteId(user.id);

  const lista = acompananteId ? await getDisponibilidadDe(acompananteId) : [];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/acompanante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Disponibilidad</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Mi disponibilidad
        </h1>
        <p className="text-(--ink)/60 mb-8">
          Publica tus franjas horarias para que los clientes puedan solicitar cita.
        </p>

        {!acompananteId ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50">No se encontró tu ficha de acompañante.</p>
          </div>
        ) : (
          <DisponibilidadManager franjas={lista} />
        )}
      </div>
    </div>
  );
}
