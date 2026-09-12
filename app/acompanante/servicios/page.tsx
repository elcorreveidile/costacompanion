import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listServiceCategories } from '@/lib/db/queries/public';
import { getMiAcompananteId, getServiciosConPaquetes } from '@/lib/db/queries/acompanante';
import { ServiciosManager } from './ServiciosManager';

export const metadata = { title: 'Mis servicios | Costa Companion' };

export default async function AcompananteServiciosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const acompananteId = await getMiAcompananteId(user.id);

  const [servicios, categorias] = await Promise.all([
    acompananteId ? getServiciosConPaquetes(acompananteId) : Promise.resolve([]),
    listServiceCategories(),
  ]);

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/acompanante" className="hover:text-(--ink) transition-colors">Mi panel</a>
          <span>›</span>
          <span className="text-(--ink)/80">Mis servicios</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Mis servicios
        </h1>
        <p className="text-(--ink)/60 mb-8">
          Gestiona los servicios que ofreces a tus clientes.
        </p>

        {!acompananteId ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50">No se encontró tu ficha de acompañante.</p>
          </div>
        ) : (
          <ServiciosManager
            servicios={servicios}
            categorias={categorias}
            acompananteId={acompananteId}
          />
        )}
      </div>
    </div>
  );
}
