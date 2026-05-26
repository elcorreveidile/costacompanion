import { createAdminClient } from '@/lib/supabase/admin';
import { toggleActivoAnunciante } from '@/lib/admin/anunciantes';
import { activarAnuncianteConStripe, cancelarAnuncianteAdmin, reactivarAnuncianteAdmin } from '@/lib/admin/partnerBilling';
import Link from 'next/link';
import type { Anunciante, EstadoStripe, CategoriaAnunciante } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Anunciantes — Admin | Costa Companion' };

const STRIPE_BADGE: Record<EstadoStripe, { label: string; bg: string; color: string }> = {
  active:          { label: 'Activa',      bg: 'rgba(74,111,80,0.12)',   color: 'var(--green-deep)' },
  trialing:        { label: 'Trial',       bg: 'rgba(74,111,80,0.08)',   color: 'var(--green)' },
  past_due:        { label: 'Pago pend.',  bg: 'rgba(180,60,50,0.10)',   color: '#b43c32' },
  canceled:        { label: 'Cancelada',   bg: 'rgba(43,39,36,0.08)',    color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { label: 'Sin suscr.',  bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

const PLAN_BADGE = {
  basico:    { label: 'Básico',    bg: 'rgba(43,39,36,0.06)',    color: 'var(--ink)' },
  destacado: { label: 'Destacado', bg: 'rgba(201,123,74,0.15)', color: 'var(--terra)' },
};

const CAT_LABEL: Record<CategoriaAnunciante, string> = {
  inmobiliaria: 'Inmobiliaria',
  salud:        'Salud',
  legal:        'Legal',
  restauracion: 'Restauración',
  comercio:     'Comercio',
  otros:        'Otros',
};

export default async function AdminAnunciantesPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from('anunciantes')
    .select('*')
    .order('created_at', { ascending: false });

  const lista = (data ?? []) as unknown as Anunciante[];
  const hayAlertasPago = lista.some((a) => a.stripe_subscription_status === 'past_due');

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-(--ink)/50 hover:text-(--ink) transition-colors mb-2 inline-block">
              ← Panel de administración
            </Link>
            <h1 className="font-display text-3xl font-semibold text-(--green)">Local Partners</h1>
            <p className="text-(--ink)/60 mt-1">
              {lista.length} anunciante{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/admin/anunciantes/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo anunciante
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
            <p className="text-sm" style={{ color: '#b43c32' }}>Hay anunciantes con pagos pendientes o fallidos.</p>
          </div>
        )}

        {lista.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <p className="text-(--ink)/50 text-lg">Aún no hay anunciantes registrados.</p>
            <Link href="/admin/anunciantes/nuevo" className="mt-4 inline-block text-(--green) font-medium hover:opacity-80 transition-opacity">
              Crear el primero →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bone-2)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Negocio</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Categoría / Zona</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">Suscripción</th>
                  <th className="text-center px-4 py-3 font-medium text-(--ink)/70">Activo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((an, i) => {
                  const badge = STRIPE_BADGE[an.stripe_subscription_status] ?? STRIPE_BADGE.sin_suscripcion;
                  const planBadge = PLAN_BADGE[an.plan] ?? PLAN_BADGE.basico;
                  return (
                    <tr
                      key={an.id}
                      style={{ background: i % 2 === 0 ? 'var(--bone)' : 'var(--bone-2)', borderTop: '1px solid var(--line)' }}
                    >
                      {/* Negocio */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-(--ink)">{an.nombre_negocio}</div>
                        <div className="text-xs text-(--ink)/50 font-mono mt-0.5">{an.slug}</div>
                      </td>

                      {/* Categoría / Zona */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-(--ink)/70">{CAT_LABEL[an.categoria] ?? an.categoria}</div>
                        {an.zona && <div className="text-xs text-(--ink)/50 mt-0.5">{an.zona}</div>}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ background: planBadge.bg, color: planBadge.color }}>
                          {planBadge.label}
                        </span>
                      </td>

                      {/* Suscripción */}
                      <td className="px-4 py-3">
                        {an.stripe_customer_id ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full self-start"
                              style={{ background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                            {an.stripe_subscription_id && an.stripe_subscription_status !== 'canceled' && (
                              <div className="flex gap-1 flex-wrap">
                                <form action={async () => { 'use server'; await cancelarAnuncianteAdmin(an.id, false); }}>
                                  <button type="submit" className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: '#b43c32', color: '#b43c32' }} title="Cancela al final del período">
                                    Cancelar período
                                  </button>
                                </form>
                                <form action={async () => { 'use server'; await cancelarAnuncianteAdmin(an.id, true); }}>
                                  <button type="submit" className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: '#b43c32', color: '#b43c32', background: 'rgba(180,60,50,0.08)' }} title="Cancela inmediatamente">
                                    Cancelar ya
                                  </button>
                                </form>
                                <form action={async () => { 'use server'; await reactivarAnuncianteAdmin(an.id); }}>
                                  <button type="submit" className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
                                    Reactivar
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        ) : (
                          <form action={async () => { 'use server'; await activarAnuncianteConStripe(an.id); }}>
                            <button type="submit" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                              style={{ background: 'var(--terra)', color: 'var(--bone)' }}>
                              Activar y facturar
                            </button>
                          </form>
                        )}
                      </td>

                      {/* Toggle activo */}
                      <td className="px-4 py-3 text-center">
                        <form action={async () => { 'use server'; await toggleActivoAnunciante(an.id, !an.activo); }}>
                          <button type="submit"
                            className="inline-flex items-center justify-center w-10 h-6 rounded-full transition-colors"
                            style={{ background: an.activo ? 'var(--green)' : 'var(--line)' }}
                            title={an.activo ? 'Desactivar' : 'Activar'}>
                            <span className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                              style={{ transform: an.activo ? 'translateX(8px)' : 'translateX(-8px)' }} />
                          </button>
                        </form>
                      </td>

                      {/* Editar */}
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/anunciantes/${an.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}>
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
