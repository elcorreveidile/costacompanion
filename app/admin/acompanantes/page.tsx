import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/lib/db';
import { acompanantes as acompanantesTable, profiles } from '@/lib/db/schema';
import { toggleActivo, toggleDestacado } from '@/lib/admin/acompanantes';
import { activarConStripe, cancelarSuscripcionAdmin, reactivarSuscripcionAdmin } from '@/lib/admin/billing';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

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
  stripe_subscription_id: string | null;
  stripe_subscription_status: EstadoStripe;
  profiles: { nombre: string | null; id: string } | null;
}

const STRIPE_BADGE: Record<EstadoStripe, { bg: string; color: string }> = {
  active:          { bg: 'rgba(74,111,80,0.12)',   color: 'var(--green-deep)' },
  trialing:        { bg: 'rgba(74,111,80,0.08)',   color: 'var(--green)' },
  past_due:        { bg: 'rgba(180,60,50,0.10)',   color: '#b43c32' },
  canceled:        { bg: 'rgba(43,39,36,0.08)',    color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

export default async function AdminAcompanantesPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin;

  const rows = await db
    .select({
      id: acompanantesTable.id,
      slug: acompanantesTable.slug,
      nombre_publico: acompanantesTable.nombrePublico,
      activo: acompanantesTable.activo,
      destacado: acompanantesTable.destacado,
      created_at: acompanantesTable.createdAt,
      stripe_customer_id: acompanantesTable.stripeCustomerId,
      stripe_subscription_id: acompanantesTable.stripeSubscriptionId,
      stripe_subscription_status: acompanantesTable.stripeSubscriptionStatus,
      profileId: acompanantesTable.profileId,
      profileNombre: profiles.nombre,
    })
    .from(acompanantesTable)
    .leftJoin(profiles, eq(profiles.id, acompanantesTable.profileId))
    .orderBy(desc(acompanantesTable.createdAt));

  const lista: AcompananteConProfile[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    nombre_publico: r.nombre_publico,
    activo: r.activo,
    destacado: r.destacado,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    stripe_customer_id: r.stripe_customer_id,
    stripe_subscription_id: r.stripe_subscription_id,
    stripe_subscription_status: (r.stripe_subscription_status ?? 'sin_suscripcion') as EstadoStripe,
    profiles: { nombre: r.profileNombre, id: r.profileId },
  }));
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
              href={localePath(locale, "/admin")}
              className="text-sm text-(--ink)/50 hover:text-(--ink) transition-colors mb-2 inline-block"
            >
              {t.shared.volverAlPanel}
            </Link>
            <h1 className="font-display text-3xl font-semibold text-(--green)">
              {t.acompanantes.tituloLista}
            </h1>
            <p className="text-(--ink)/60 mt-1">
              {(lista.length === 1 ? t.acompanantes.registradosUno : t.acompanantes.registradosVarios).replace('{n}', String(lista.length))}
            </p>
          </div>
          <Link
            href={localePath(locale, "/admin/acompanantes/nuevo")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t.acompanantes.nuevoBtn}
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
              {t.acompanantes.alertaPagos}
            </p>
          </div>
        )}

        {lista.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50 text-lg">{t.acompanantes.vacio}</p>
            <Link
              href={localePath(locale, "/admin/acompanantes/nuevo")}
              className="mt-4 inline-block text-(--green) font-medium hover:opacity-80 transition-opacity"
            >
              {t.shared.crearPrimero}
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
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.acompanantes.thNombre}</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.acompanantes.thSlug}</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/70">{t.acompanantes.thSuscripcion}</th>
                  <th className="text-center px-4 py-3 font-medium text-(--ink)/70">{t.acompanantes.thActivo}</th>
                  <th className="text-center px-4 py-3 font-medium text-(--ink)/70">{t.acompanantes.thDestacado}</th>
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
                          <div className="flex flex-col gap-1.5">
                            <span
                              className="text-xs font-medium px-2.5 py-1 rounded-full self-start"
                              style={{ background: badge.bg, color: badge.color }}
                            >
                              {t.shared.estadosStripe[ac.stripe_subscription_status] ?? t.shared.estadosStripe.sin_suscripcion}
                            </span>
                            {ac.stripe_subscription_id && ac.stripe_subscription_status !== 'canceled' && (
                              <div className="flex gap-1 flex-wrap">
                                <form
                                  action={async () => {
                                    'use server';
                                    await cancelarSuscripcionAdmin(ac.id, false);
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: '#b43c32', color: '#b43c32' }}
                                    title={t.shared.cancelarPeriodoTitle}
                                  >
                                    {t.shared.cancelarPeriodo}
                                  </button>
                                </form>
                                <form
                                  action={async () => {
                                    'use server';
                                    await cancelarSuscripcionAdmin(ac.id, true);
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: '#b43c32', color: '#b43c32', background: 'rgba(180,60,50,0.08)' }}
                                    title={t.shared.cancelarYaTitle}
                                  >
                                    {t.shared.cancelarYa}
                                  </button>
                                </form>
                                <form
                                  action={async () => {
                                    'use server';
                                    await reactivarSuscripcionAdmin(ac.id);
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                                    style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                                    title={t.shared.reactivarTitle}
                                  >
                                    {t.shared.reactivar}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
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
                              {t.shared.activarFacturar}
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
                            title={ac.activo ? t.shared.desactivar : t.shared.activar}
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
                            title={ac.destacado ? t.acompanantes.quitarDestacado : t.acompanantes.destacar}
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
                          href={localePath(locale, `/admin/acompanantes/${ac.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}
                        >
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
