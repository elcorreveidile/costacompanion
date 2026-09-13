import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/lib/db';
import { anunciantes as anunciantesTable } from '@/lib/db/schema';
import { rowToAnunciante } from '@/lib/admin/anunciantes-map';
import { toggleActivoAnunciante } from '@/lib/admin/anunciantes';
import { activarAnuncianteConStripe, cancelarAnuncianteAdmin, reactivarAnuncianteAdmin } from '@/lib/admin/partnerBilling';
import type { Anunciante, EstadoStripe } from '@/types/supabase';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Anunciantes — Admin | Costa Companion' };

const STRIPE_BADGE: Record<EstadoStripe, { bg: string; color: string }> = {
  active:          { bg: 'rgba(74,111,80,0.12)',   color: 'var(--green-deep)' },
  trialing:        { bg: 'rgba(74,111,80,0.08)',   color: 'var(--green)' },
  past_due:        { bg: 'rgba(180,60,50,0.10)',   color: '#b43c32' },
  canceled:        { bg: 'rgba(43,39,36,0.08)',    color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

const PLAN_BADGE = {
  basico:    { bg: 'rgba(43,39,36,0.06)',    color: 'var(--ink)' },
  destacado: { bg: 'rgba(201,123,74,0.15)', color: 'var(--terra)' },
};

export default async function AdminAnunciantesPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin;
  const catLabel = dict.common.categoriasAnunciante;

  const rows = await db
    .select()
    .from(anunciantesTable)
    .orderBy(desc(anunciantesTable.createdAt));

  const lista: Anunciante[] = rows.map(rowToAnunciante);
  const pendientes = lista.filter((a) => !a.activo && !a.stripe_customer_id);
  const hayAlertasPago = lista.some((a) => a.stripe_subscription_status === 'past_due');

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link href={localePath(locale, "/admin")} className="text-sm text-(--ink)/50 hover:text-(--ink) transition-colors mb-2 inline-block">
              {t.shared.volverAlPanel}
            </Link>
            <h1 className="font-display text-3xl font-semibold text-(--green)">{t.anunciantes.tituloLista}</h1>
            <p className="text-(--ink)/60 mt-1">
              {(lista.length === 1 ? t.anunciantes.registradosUno : t.anunciantes.registradosVarios).replace('{n}', String(lista.length))}
            </p>
          </div>
          <Link
            href={localePath(locale, "/admin/anunciantes/nuevo")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80 shrink-0 self-start sm:self-auto"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t.anunciantes.nuevoBtn}
          </Link>
        </div>

        {/* Alerta pendientes de aprobación (auto-alta pública) */}
        {pendientes.length > 0 && (
          <div
            className="rounded-xl border px-5 py-4 mb-4 flex items-center gap-3"
            style={{ background: 'rgba(201,123,74,0.08)', borderColor: 'var(--terra)' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="var(--terra)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--terra)' }}>
              {(pendientes.length === 1 ? t.anunciantes.pendientesUno : t.anunciantes.pendientesVarios).replace('{n}', String(pendientes.length))}
            </p>
          </div>
        )}

        {/* Alerta pagos fallidos */}
        {hayAlertasPago && (
          <div
            className="rounded-xl border px-5 py-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(180,60,50,0.06)', borderColor: '#b43c32' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#b43c32" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm" style={{ color: '#b43c32' }}>{t.anunciantes.alertaPagos}</p>
          </div>
        )}

        {lista.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <p className="text-(--ink)/50 text-lg">{t.anunciantes.vacio}</p>
            <Link href={localePath(locale, "/admin/anunciantes/nuevo")} className="mt-4 inline-block text-(--green) font-medium hover:opacity-80 transition-opacity">
              {t.shared.crearPrimero}
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border shadow-sm overflow-x-auto" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full text-sm min-w-[720px]">
              <thead style={{ background: 'var(--bone-2)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.anunciantes.thNegocio}</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.anunciantes.thCategoriaZona}</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.anunciantes.thPlan}</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.anunciantes.thSuscripcion}</th>
                  <th className="text-center px-4 py-3 font-medium text-(--ink)/70">{t.anunciantes.thActivo}</th>
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
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-(--ink)">{an.nombre_negocio}</span>
                          {!an.activo && !an.stripe_customer_id && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(201,123,74,0.15)', color: 'var(--terra)' }}>
                              {t.anunciantes.pendienteBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-(--ink)/50 font-mono mt-0.5">{an.slug}</div>
                      </td>

                      {/* Categoría / Zona */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-(--ink)/70">{catLabel[an.categoria] ?? an.categoria}</div>
                        {an.zona && <div className="text-xs text-(--ink)/50 mt-0.5">{an.zona}</div>}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ background: planBadge.bg, color: planBadge.color }}>
                          {t.anunciantes.planes[an.plan] ?? t.anunciantes.planes.basico}
                        </span>
                      </td>

                      {/* Suscripción */}
                      <td className="px-4 py-3">
                        {an.stripe_customer_id ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full self-start"
                              style={{ background: badge.bg, color: badge.color }}>
                              {t.shared.estadosStripe[an.stripe_subscription_status] ?? t.shared.estadosStripe.sin_suscripcion}
                            </span>
                            {an.stripe_subscription_id && an.stripe_subscription_status !== 'canceled' && (
                              <div className="flex gap-1 flex-wrap">
                                <form action={async () => { 'use server'; await cancelarAnuncianteAdmin(an.id, false); }}>
                                  <button type="submit" className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: '#b43c32', color: '#b43c32' }} title={t.shared.cancelarPeriodoTitle}>
                                    {t.shared.cancelarPeriodo}
                                  </button>
                                </form>
                                <form action={async () => { 'use server'; await cancelarAnuncianteAdmin(an.id, true); }}>
                                  <button type="submit" className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: '#b43c32', color: '#b43c32', background: 'rgba(180,60,50,0.08)' }} title={t.shared.cancelarYaTitle}>
                                    {t.shared.cancelarYa}
                                  </button>
                                </form>
                                <form action={async () => { 'use server'; await reactivarAnuncianteAdmin(an.id); }}>
                                  <button type="submit" className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: 'var(--green)', color: 'var(--green)' }} title={t.shared.reactivarTitle}>
                                    {t.shared.reactivar}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        ) : (
                          <form action={async () => { 'use server'; await activarAnuncianteConStripe(an.id); }}>
                            <button type="submit" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                              style={{ background: 'var(--terra)', color: 'var(--bone)' }}>
                              {t.shared.activarFacturar}
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
                            title={an.activo ? t.shared.desactivar : t.shared.activar}>
                            <span className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                              style={{ transform: an.activo ? 'translateX(8px)' : 'translateX(-8px)' }} />
                          </button>
                        </form>
                      </td>

                      {/* Editar */}
                      <td className="px-4 py-3 text-right">
                        <Link href={localePath(locale, `/admin/anunciantes/${an.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                          {t.shared.editar}
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
