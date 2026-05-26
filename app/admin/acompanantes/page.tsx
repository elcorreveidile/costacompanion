import { createAdminClient } from '@/lib/supabase/admin';
import { toggleActivo, toggleDestacado } from '@/lib/admin/acompanantes';
import { activarConStripe } from '@/lib/admin/billing';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acompañantes — Admin | Costa Companion' };

type EstadoStripe = 'sin_suscripcion' | 'active' | 'past_due' | 'canceled' | 'trialing';

interface AcompananteConProfile {
  id: string;
  slug: string;
  nombre_publico: string;
  activo: boolean;
  destacado: boolean;
  created_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_status: EstadoStripe;
  profiles: { nombre: string | null; id: string } | null;
}

const STRIPE_BADGE: Record<EstadoStripe, { label: string; bg: string; color: string }> = {
  active:          { label: 'Activa',      bg: 'rgba(74,111,80,0.12)',   color: 'var(--green-deep)' },
  trialing:        { label: 'Trial',       bg: 'rgba(74,111,80,0.08)',   color: 'var(--green)' },
  past_due:        { label: 'Pago pend.',  bg: 'rgba(180,60,50,0.10)',   color: '#b43c32' },
  canceled:        { label: 'Cancelada',   bg: 'rgba(43,39,36,0.08)',    color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { label: 'Sin suscr.',  bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

export default async function AdminAcompanantesPage() {
  const admin = createAdminClient();

  const { data: acompanantes } = await admin
    .from('acompanantes')
    .select('id, slug, nombre_publico, activo, destacado, created_at, stripe_customer_id, stripe_subscription_status, profiles(nombre, id)')
    .order('created_at', { ascending: false });

  const lista = (acompanantes ?? []) as unknown as AcompananteConProfile[];
  const hayAlertasPago = lista.some(
    (a) => a.stripe_subscription_status === 'past_due'
  );

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className="text-sm text-(--ink)/50 hover:text-(--ink) transition-colors mb-2 inline-block"
            >
              ← Panel de administración
            </Link>
            <h1 className="font-display text-3xl font-semibold text-(--green)">
              Acompañantes
            </h1>
            <p className="text-(--ink)/60 mt-1">
              {lista.length} acompañante{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/admin/acompanantes/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo acompañante
          </Link>
        </div>

        {/* Alerta pagos fallidos */}
        {hayAlertasPago && (
          <div
            className="rounded-xl border px-5 py-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(180,60,50,0.06)', borderColor: '#b43c32' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#b43c32" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm" style={{ color: '#b43c32' }}>
              Hay acompañantes con pagos pendientes o fallidos.
            </p>
          </div>
        )}

        {lista.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50 text-lg">Aún no hay acompañantes registrados.</p>
            <Link
              href="/admin/acompanantes/nuevo"
              className="mt-4 inline-block text-(--green) font-medium hover:opacity-80 transition-opacity"
            >
              Crear el primero →
            </Link>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: 'var(--line)' }}
          >
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bone-2)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Slug</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Suscripción</th>
                  <th className="text-center px-4 py-3 font-medium text-(--ink)/70">Activo</th>
                  <th className="text-center px-4 py-3 font-medium text-(--ink)/70">Dest.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((ac, i) => {
                  const badge = STRIPE_BADGE[ac.stripe_subscription_status] ?? STRIPE_BADGE.sin_suscripcion;
                  return (
                    <tr
                      key={ac.id}
                      style={{
                        background: i % 2 === 0 ? 'var(--bone)' : 'var(--bone-2)',
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-(--ink)">{ac.nombre_publico}</div>
                        {ac.profiles?.nombre && (
                          <div className="text-xs text-(--ink)/50 mt-0.5">{ac.profiles.nombre}</div>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="px-4 py-3 text-(--ink)/60 font-mono text-xs">{ac.slug}</td>

                      {/* Suscripción Stripe */}
                      <td className="px-4 py-3">
                        {ac.stripe_customer_id ? (
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <form
                            action={async () => {
                              'use server';
                              await activarConStripe(ac.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                              style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                            >
                              Activar y facturar
                            </button>
                          </form>
                        )}
                      </td>

                      {/* Toggle activo */}
                      <td className="px-4 py-3 text-center">
                        <form
                          action={async () => {
                            'use server';
                            await toggleActivo(ac.id, !ac.activo);
                          }}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center w-10 h-6 rounded-full transition-colors"
                            style={{ background: ac.activo ? 'var(--green)' : 'var(--line)' }}
                            title={ac.activo ? 'Desactivar' : 'Activar'}
                          >
                            <span
                              className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                              style={{ transform: ac.activo ? 'translateX(8px)' : 'translateX(-8px)' }}
                            />
                          </button>
                        </form>
                      </td>

                      {/* Toggle destacado */}
                      <td className="px-4 py-3 text-center">
                        <form
                          action={async () => {
                            'use server';
                            await toggleDestacado(ac.id, !ac.destacado);
                          }}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center w-10 h-6 rounded-full transition-colors"
                            style={{ background: ac.destacado ? 'var(--terra)' : 'var(--line)' }}
                            title={ac.destacado ? 'Quitar destacado' : 'Destacar'}
                          >
                            <span
                              className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                              style={{ transform: ac.destacado ? 'translateX(8px)' : 'translateX(-8px)' }}
                            />
                          </button>
                        </form>
                      </td>

                      {/* Editar */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/acompanantes/${ac.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
