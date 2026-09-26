import { redirect } from 'next/navigation';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acompanantes, profiles, reservas } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { reembolsarReserva } from '@/lib/reservas/cancelacion';
import {
  listarCandidatos,
  reasignarReserva,
} from '@/lib/reservas/asignaciones';
import { modalidadCompatible, formatEuros } from '@/lib/precios';
import { fechaHoraMadrid } from '@/lib/tiempo';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import type { EstadoReserva } from '@/types/supabase';
import ColaAsignacion from './ColaAsignacion';

export const dynamic = 'force-dynamic';

const ESTADO_BADGE: Record<EstadoReserva, { bg: string; color: string }> = {
  pendiente: { bg: 'var(--terra-soft)', color: 'var(--terra)' },
  confirmada: { bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
  cancelada: { bg: 'rgba(43,39,36,0.08)', color: 'rgba(43,39,36,0.5)' },
  completada: { bg: 'rgba(34,70,40,0.12)', color: 'var(--green-deep)' },
};

const PAGO_BADGE: Record<string, { bg: string; color: string }> = {
  pendiente_pago: { bg: 'var(--terra-soft)', color: 'var(--terra)' },
  pendiente_cobro: { bg: 'var(--terra-soft)', color: 'var(--terra)' },
  pagada: { bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  cobrada: { bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  reembolsada: { bg: 'rgba(43,39,36,0.08)', color: 'rgba(43,39,36,0.5)' },
};

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ error_asignacion?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  if (user.rol !== 'superadmin') redirect('/');

  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin.reservas;
  const admin = dict.panelAdmin;
  const { error_asignacion: errorAsignacion } = await searchParams;

  const [rows, candidatos] = await Promise.all([
    db
      .select({
        id: reservas.id,
        estado: reservas.estado,
        estadoPago: reservas.estadoPago,
        metodoPago: reservas.metodoPago,
        modoGestion: reservas.modoGestion,
        precioTotalCents: reservas.precioTotalCents,
        reembolsoCents: reservas.reembolsoCents,
        politicaAplicada: reservas.politicaAplicada,
        noShow: reservas.noShow,
        canceladaMotivo: reservas.canceladaMotivo,
        fechaHora: reservas.fechaHora,
        // leftJoin: una petición en cola (Fase C1) no tiene acompañante.
        acompaId: reservas.acompananteId,
        acompNombre: acompanantes.nombrePublico,
        acompSlug: acompanantes.slug,
        clienteNombre: profiles.nombre,
        clienteEmail: profiles.email,
      })
      .from(reservas)
      .leftJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
      .innerJoin(profiles, eq(profiles.id, reservas.clienteId))
      .where(eq(reservas.tipoReserva, 'gestion'))
      .orderBy(desc(reservas.createdAt))
      .limit(200),
    listarCandidatos(),
  ]);

  // Cola de reembolsos: se cobró y la política exige devolver dinero, pero el
  // reembolso automático falló (estadoPago sigue en «pagada»).
  const cola = rows.filter(
    (r) =>
      r.estadoPago === 'pagada' &&
      !r.noShow &&
      (r.politicaAplicada === 'gratuita' ||
        r.politicaAplicada === 'mitad' ||
        r.estado === 'rechazada')
  );

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, '/admin')} className="hover:text-(--ink) transition-colors">
            {admin.shared.admin}
          </a>
          <span>›</span>
          <span className="text-(--ink)/80">{t.breadcrumb}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-8">{t.h1}</h1>

        {errorAsignacion && (
          <div
            className="rounded-xl border p-4 mb-6 text-sm"
            style={{ background: 'var(--terra-soft)', borderColor: 'transparent', color: 'var(--terra)' }}
          >
            {t.colaAsignacion.errorPrecio}
          </div>
        )}

        {/* Cola de asignación manual (Fase C1): peticiones sin acompañante */}
        <ColaAsignacion candidatos={candidatos} dict={dict} locale={locale} />

        {/* Cola de reembolsos pendientes */}
        {cola.length > 0 && (
          <div
            className="rounded-xl border p-6 mb-8"
            style={{ background: 'var(--terra-soft)', borderColor: 'transparent' }}
          >
            <h2 className="font-display text-lg font-medium text-(--terra) mb-1">{t.colaTitulo}</h2>
            <p className="text-sm text-(--ink)/60 mb-4">{t.colaDesc}</p>
            <div className="space-y-2">
              {cola.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 flex-wrap rounded-lg bg-(--bone-2) px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-(--ink)">{r.clienteNombre ?? r.clienteEmail}</span>
                    <span className="text-(--ink)/50"> · {r.acompNombre}</span>
                    <span className="text-(--ink)/50"> · {fechaHoraMadrid(r.fechaHora)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-(--terra)">
                      {formatEuros((r.precioTotalCents ?? 0) - r.reembolsoCents, locale)}
                    </span>
                    <form action={reembolsarReserva}>
                      <input type="hidden" name="reserva_id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                      >
                        {t.reembolsar}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listado completo */}
        {rows.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40">{t.vacio}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const badge = ESTADO_BADGE[r.estado] ?? ESTADO_BADGE.pendiente;
              const pagoBadge = PAGO_BADGE[r.estadoPago];
              const enCola = cola.some((c) => c.id === r.id);
              // Reasignación solo pre-pago y con acompañante previo.
              const puedeReasignar =
                !!r.acompSlug &&
                r.estado === 'pendiente' &&
                (r.estadoPago === 'pendiente_pago' || r.estadoPago === 'pendiente_cobro');
              return (
                <div
                  key={r.id}
                  className="rounded-xl border p-5 shadow-sm"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-(--ink)">
                        {r.clienteNombre ?? r.clienteEmail}
                        <span className="text-(--ink)/40 font-normal text-sm"> · {r.clienteEmail}</span>
                      </p>
                      <p className="text-sm text-(--ink)/60 mt-0.5">
                        {r.acompSlug ? (
                          <Link
                            href={localePath(locale, `/${r.acompSlug}`)}
                            className="hover:text-(--ink) transition-colors"
                          >
                            {r.acompNombre}
                          </Link>
                        ) : (
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ background: 'var(--terra-soft)', color: 'var(--terra)' }}
                          >
                            {t.colaAsignacion.sinAsignar}
                          </span>
                        )}
                        {r.modoGestion && <> · {t.modos[r.modoGestion]}</>}
                        {r.metodoPago === 'efectivo' && <> · {dict.panelCliente.detalle.metodos.efectivo}</>}
                      </p>
                      <p className="text-sm text-(--ink)/50 mt-0.5">{fechaHoraMadrid(r.fechaHora)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {dict.panelAcompanante.reservas.estados[r.estado] ?? r.estado}
                      </span>
                      {pagoBadge && (
                        <span
                          className="text-xs font-medium px-3 py-1 rounded-full"
                          style={{ background: pagoBadge.bg, color: pagoBadge.color }}
                        >
                          {t.estadosPago[r.estadoPago]}
                          {r.precioTotalCents != null && <> · {formatEuros(r.precioTotalCents, locale)}</>}
                        </span>
                      )}
                      {r.reembolsoCents > 0 && (
                        <span className="text-xs text-(--ink)/50">
                          {t.reembolsado.replace('{importe}', formatEuros(r.reembolsoCents, locale))}
                        </span>
                      )}
                      {r.politicaAplicada && (
                        <span className="text-xs text-(--ink)/40">{t.politicas[r.politicaAplicada]}</span>
                      )}
                      {r.canceladaMotivo === 'expirada_pago' && (
                        <span className="text-xs text-(--terra)">{t.motivoExpirada}</span>
                      )}
                      {r.noShow && (
                        <span className="text-xs text-(--terra)">{t.noShowTag}</span>
                      )}
                      {enCola && (
                        <form action={reembolsarReserva}>
                          <input type="hidden" name="reserva_id" value={r.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                          >
                            {t.reembolsar}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Reasignación pre-pago: recalcula el precio con el nuevo asignado */}
                  {puedeReasignar && (
                    <form
                      action={reasignarReserva}
                      className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <input type="hidden" name="reserva_id" value={r.id} />
                      <select
                        name="acompanante_id"
                        required
                        defaultValue=""
                        className="px-3 py-1.5 rounded-lg border text-xs bg-(--bone)"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                      >
                        <option value="" disabled>
                          {t.colaAsignacion.reasignar}…
                        </option>
                        {candidatos
                          .filter(
                            (cd) =>
                              cd.id !== r.acompaId &&
                              !!r.modoGestion &&
                              modalidadCompatible(cd.modalidades, r.modoGestion)
                          )
                          .map((cd) => (
                            <option key={cd.id} value={cd.id}>
                              {cd.nombrePublico}
                            </option>
                          ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                      >
                        {t.colaAsignacion.reasignar}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
