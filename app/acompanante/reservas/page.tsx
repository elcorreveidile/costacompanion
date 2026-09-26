import { redirect } from 'next/navigation';
import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { zonas as tZonas } from '@/lib/db/schema';
import { confirmarReserva, rechazarReserva, guardarEnlaceVideo } from '@/lib/reservas/actions';
import { marcarNoShow } from '@/lib/reservas/cancelacion';
import { cobrarEfectivo, cerrarSesion, guardarNotasGestion } from '@/lib/acompanante/agenda';
import { RealtimeRefresher } from '@/components/RealtimeRefresher';
import { getSessionUser } from '@/lib/auth/session';
import {
  getMiAcompananteId,
  getReservasDeAcompanante,
  getAgendaDelDia,
  getDocumentosDeReservas,
} from '@/lib/db/queries/acompanante';
import type { EstadoReserva } from '@/types/supabase';
import { videoEnVentana } from '@/lib/reservas/videollamada';
import { fechaISOenMadrid } from '@/lib/tiempo';
import { pickLang } from '@/lib/i18n/pick';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

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

export const metadata = { title: 'Reservas recibidas | Costa Companion' };

export default async function AcompananteReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ video_error?: string; vista?: string }>;
}) {
  const { locale, dict } = await getI18n();
  const t = dict.panelAcompanante;
  const { video_error: videoError, vista: vistaRaw } = await searchParams;
  const vista = vistaRaw === 'pendientes' ? 'pendientes' : 'agenda';

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) redirect(localePath(locale, '/acompanante'));

  // Nombres localizados de municipio (keys de zonas).
  const zonasRows = await db.select().from(tZonas).orderBy(asc(tZonas.orden));
  const zonaNombre = new Map<string, string>(
    zonasRows.map((z) => [z.key, pickLang(z.nombre as Record<string, unknown> | null, locale) || z.key])
  );

  // Agenda de hoy (día natural Madrid) + documentos legibles de esas reservas.
  const hoyISO = fechaISOenMadrid(new Date());
  const agenda = await getAgendaDelDia(acompananteId, hoyISO);
  const docsAgenda = await getDocumentosDeReservas(acompananteId, agenda.map((a) => a.id));

  // Flujo actual: pendientes de confirmar + confirmadas sin cerrar.
  const reservas = (await getReservasDeAcompanante(acompananteId)).filter(
    (r) => r.estado === 'pendiente' || r.estado === 'confirmada'
  );

  const tabBase = 'px-4 py-2 rounded-full text-sm font-medium transition-opacity';

  return (
    <div className="min-h-screen bg-(--bone)">
      <RealtimeRefresher table="reservas" filter={`acompanante_id=eq.${acompananteId}`} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-6">
          <Link
            href={localePath(locale, "/acompanante")}
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.shared.volverAlPanel}
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            {t.reservas.h1}
          </h1>
        </div>

        {/* Pestañas: Agenda de hoy / Pendientes */}
        <div className="flex gap-2 mb-8">
          <Link
            href={localePath(locale, '/acompanante/reservas')}
            className={tabBase}
            style={
              vista === 'agenda'
                ? { background: 'var(--green)', color: 'var(--bone)' }
                : { border: '1px solid var(--line)', color: 'var(--ink)' }
            }
          >
            {t.reservas.tabAgenda}
          </Link>
          <Link
            href={localePath(locale, '/acompanante/reservas?vista=pendientes')}
            className={tabBase}
            style={
              vista === 'pendientes'
                ? { background: 'var(--green)', color: 'var(--bone)' }
                : { border: '1px solid var(--line)', color: 'var(--ink)' }
            }
          >
            {t.reservas.tabPendientes}
            {reservas.length > 0 ? ` (${reservas.length})` : ''}
          </Link>
        </div>

        {videoError && (
          <p
            className="text-sm font-medium px-4 py-3 rounded-lg mb-6"
            style={{ background: 'var(--terra-soft)', color: 'var(--terra)' }}
          >
            {t.reservas.enlaceInvalido}
          </p>
        )}

        {vista === 'agenda' ? (
          /* ═══════════ AGENDA DE HOY ═══════════ */
          agenda.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <p className="text-(--ink)/40 text-lg">{t.reservas.agendaVacia}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agenda.map((item) => {
                const badge = ESTADO_BADGE[item.estado] ?? ESTADO_BADGE.confirmada;
                const estadoLabel = t.reservas.estados[item.estado] ?? item.estado;
                const pagoBadge = item.estado_pago !== 'no_aplica' ? PAGO_BADGE[item.estado_pago] : null;
                const tituloServicio = item.servicios?.titulo
                  ? ((item.servicios.titulo as { es?: string }).es ?? null)
                  : null;
                const docs = docsAgenda.get(item.id) ?? [];
                const videoActivo = !!item.enlace_video && videoEnVentana(new Date(item.fecha_hora));
                const puedeCobrar =
                  item.estado === 'confirmada' &&
                  item.metodo_pago === 'efectivo' &&
                  item.estado_pago === 'pendiente_cobro';
                const puedeCerrar =
                  item.estado === 'confirmada' &&
                  (item.estado_pago === 'pagada' ||
                    item.estado_pago === 'cobrada' ||
                    item.estado_pago === 'no_aplica');
                const puedeNoShow = item.estado === 'confirmada';

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-start gap-4 flex-wrap">
                      {/* Hora */}
                      <div className="shrink-0 text-center">
                        <p className="font-display text-2xl font-semibold text-(--green) leading-none">
                          {item.hora_madrid}
                        </p>
                        <p className="text-xs text-(--ink)/40 mt-1">Madrid</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Ruta: municipio + cliente */}
                        <p className="font-display text-lg font-medium text-(--ink)">
                          {item.zona ? zonaNombre.get(item.zona) ?? item.zona : dict.common.modalidades[item.modalidad]}
                        </p>
                        <p className="text-sm text-(--ink)/70 mt-0.5">
                          {item.cliente?.nombre ?? t.shared.cliente}
                          {item.idioma_gestion ? ` · ${item.idioma_gestion.toUpperCase()}` : ''}
                          {item.cliente?.idioma ? ` (${item.cliente.idioma})` : ''}
                        </p>
                        {tituloServicio && (
                          <p className="text-sm text-(--ink)/50 mt-0.5">{tituloServicio}</p>
                        )}
                        {item.detalle_servicio && (
                          <p className="text-xs text-(--ink)/50 mt-1 whitespace-pre-wrap">
                            {item.detalle_servicio}
                          </p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className="text-xs font-medium px-3 py-1 rounded-full"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {estadoLabel}
                        </span>
                        {pagoBadge && (
                          <span
                            className="text-xs font-medium px-3 py-1 rounded-full"
                            style={{ background: pagoBadge.bg, color: pagoBadge.color }}
                          >
                            {dict.panelCliente.reservas.estadosPago[item.estado_pago] ?? item.estado_pago}
                            {item.precio_total_cents != null && (
                              <> · {new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(item.precio_total_cents / 100)}</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Videollamada + documentos */}
                    {(videoActivo || docs.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-4 items-center">
                        {videoActivo && item.enlace_video && (
                          <a
                            href={item.enlace_video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                            style={{ color: 'var(--green)' }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {dict.panelCliente.detalle.enlaceVideo}
                          </a>
                        )}
                        {docs.map((d) => (
                          <a
                            key={d.id}
                            href={`/api/documentos/${d.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline transition-opacity hover:opacity-70 truncate max-w-48"
                            style={{ color: 'var(--ink)', opacity: 0.6 }}
                            title={d.nombre}
                          >
                            📄 {d.nombre}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Acciones de cierre */}
                    {item.estado === 'confirmada' && (
                      <div className="mt-4 pt-4 border-t flex gap-3 flex-wrap items-center" style={{ borderColor: 'var(--line)' }}>
                        {puedeCobrar && (
                          <form action={cobrarEfectivo}>
                            <input type="hidden" name="reserva_id" value={item.id} />
                            <button
                              type="submit"
                              className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                              style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                            >
                              {t.reservas.cobrarEfectivo}
                            </button>
                          </form>
                        )}
                        {puedeCerrar && (
                          <form action={cerrarSesion}>
                            <input type="hidden" name="reserva_id" value={item.id} />
                            <button
                              type="submit"
                              className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                              style={{ background: 'var(--green-deep)', color: 'var(--bone)' }}
                            >
                              {t.reservas.marcarCompletada}
                            </button>
                          </form>
                        )}
                        {puedeNoShow && (
                          <form action={marcarNoShow}>
                            <input type="hidden" name="reserva_id" value={item.id} />
                            <button
                              type="submit"
                              className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                              style={{ borderColor: 'var(--line)', color: 'rgba(43,39,36,0.6)', background: 'transparent' }}
                            >
                              {t.reservas.marcarNoShow}
                            </button>
                          </form>
                        )}
                        <Link
                          href={localePath(locale, "/acompanante/mensajes")}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {t.shared.chat}
                        </Link>
                      </div>
                    )}

                    {/* Notas privadas (RGPD: nunca visibles para el cliente) */}
                    <details className="mt-4">
                      <summary className="text-sm cursor-pointer select-none" style={{ color: 'var(--ink)', opacity: 0.5 }}>
                        {t.reservas.notasLabel}
                      </summary>
                      <form action={guardarNotasGestion} className="mt-2">
                        <input type="hidden" name="reserva_id" value={item.id} />
                        <textarea
                          name="notas"
                          rows={3}
                          defaultValue={item.notas_acompanante ?? ''}
                          placeholder={t.reservas.notasAviso}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-(--bone) resize-none"
                          style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                        />
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <p className="text-xs text-(--ink)/30">{t.reservas.notasAviso}</p>
                          <button
                            type="submit"
                            className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70 shrink-0"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                          >
                            {t.reservas.notasGuardar}
                          </button>
                        </div>
                      </form>
                    </details>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ═══════════ PENDIENTES (flujo actual) ═══════════ */
          reservas.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <p className="text-(--ink)/40 text-lg">{t.reservas.vacioTitulo}</p>
              <p className="text-(--ink)/30 text-sm mt-2">
                {t.reservas.vacioTexto}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservas.map((reserva) => {
                const badge = ESTADO_BADGE[reserva.estado] ?? ESTADO_BADGE.pendiente;
                const estadoLabel = t.reservas.estados[reserva.estado] ?? t.reservas.estados.pendiente;
                const fechaStr = new Date(reserva.fecha_hora).toLocaleString(locale, {
                  weekday: 'short', day: 'numeric', month: 'short',
                  year: 'numeric', hour: '2-digit', minute: '2-digit',
                });
                const tituloServicio = reserva.servicios?.titulo
                  ? ((reserva.servicios.titulo as { es?: string }).es ?? null)
                  : null;
                const esRemota = reserva.modalidad === 'remoto';

                return (
                  <div
                    key={reserva.id}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Nombre cliente */}
                        <p className="font-display text-lg font-medium text-(--green)">
                          {reserva.profiles?.nombre ?? t.shared.cliente}
                        </p>

                        {/* Servicio */}
                        {tituloServicio && (
                          <p className="text-sm text-(--ink)/70 mt-0.5">{tituloServicio}</p>
                        )}

                        {/* Detalles */}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-(--ink)/60">
                          <span>{fechaStr}</span>
                          <span>·</span>
                          <span>{dict.common.modalidades[reserva.modalidad] ?? reserva.modalidad}</span>
                          {reserva.zona && (
                            <>
                              <span>·</span>
                              <span>{reserva.zona}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Badge de estado */}
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {estadoLabel}
                      </span>
                    </div>

                    {/* Acciones según estado */}
                    {reserva.estado === 'pendiente' && (
                      <div className="mt-4 pt-4 border-t flex gap-3 flex-wrap" style={{ borderColor: 'var(--line)' }}>
                        <form action={confirmarReserva}>
                          <input type="hidden" name="reserva_id" value={reserva.id} />
                          <button
                            type="submit"
                            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                            style={{ background: 'var(--green)', color: 'var(--bone)' }}
                          >
                            {t.reservas.confirmar}
                          </button>
                        </form>
                        <form action={rechazarReserva}>
                          <input type="hidden" name="reserva_id" value={reserva.id} />
                          <button
                            type="submit"
                            className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                            style={{ borderColor: 'var(--line)', color: 'rgba(43,39,36,0.6)', background: 'transparent' }}
                          >
                            {t.reservas.rechazar}
                          </button>
                        </form>
                      </div>
                    )}

                    {reserva.estado === 'confirmada' && (
                      <div className="mt-4 pt-4 border-t flex gap-3 flex-wrap" style={{ borderColor: 'var(--line)' }}>
                        <Link
                          href={localePath(locale, '/acompanante/reservas')}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}
                        >
                          {t.reservas.tabAgenda}
                        </Link>
                        <Link
                          href={localePath(locale, "/acompanante/mensajes")}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {t.shared.chat}
                        </Link>

                        {/* Videollamada remota: enlace actual + override Meet/Zoom */}
                        {esRemota && (
                          <div className="w-full mt-2">
                            {reserva.enlace_video && (
                              <a
                                href={reserva.enlace_video}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium mb-2 transition-opacity hover:opacity-80"
                                style={{ color: 'var(--green)' }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {dict.panelCliente.detalle.enlaceVideo}
                              </a>
                            )}
                            <form action={guardarEnlaceVideo} className="flex gap-2 flex-wrap items-center">
                              <input type="hidden" name="reserva_id" value={reserva.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <input
                                type="url"
                                name="enlace_video"
                                placeholder={t.reservas.enlacePlaceholder}
                                defaultValue={reserva.enlace_video ?? ''}
                                className="flex-1 min-w-56 text-sm px-3 py-2 rounded-lg border bg-transparent"
                                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                              />
                              <button
                                type="submit"
                                className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                              >
                                {t.reservas.enlaceGuardar}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
