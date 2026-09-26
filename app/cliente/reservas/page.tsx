import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cancelarReserva } from '@/lib/reservas/actions';
import { cancelarReservaGestion } from '@/lib/reservas/cancelacion';
import { iniciarPagoReserva } from '@/lib/reservas/pagos';
import { RealtimeRefresher } from '@/components/RealtimeRefresher';
import { getSessionUser } from '@/lib/auth/session';
import { getReservasDeCliente, getReservaIdsResenadas, type ReservaCliente } from '@/lib/db/queries/cliente';
import type { EstadoReserva } from '@/types/supabase';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { formatEuros } from '@/lib/precios';
import { getI18n } from '@/lib/i18n/server';
import { localePath, type Locale } from '@/lib/i18n/config';

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

export const metadata = { title: 'Mis reservas | Costa Companion' };

export default async function ClienteReservasPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelCliente;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const [reservas, reviewedReservaIds] = await Promise.all([
    getReservasDeCliente(user.id),
    getReservaIdsResenadas(user.id),
  ]);

  // Próximas (pendientes/confirmadas futuras, la más cercana primero) vs historial.
  const ahora = Date.now();
  const activas = reservas
    .filter(
      (r) =>
        (r.estado === 'pendiente' || r.estado === 'confirmada') &&
        new Date(r.fecha_hora).getTime() >= ahora
    )
    .sort((a, b) => +new Date(a.fecha_hora) - +new Date(b.fecha_hora));
  const historial = reservas
    .filter((r) => !activas.includes(r))
    .sort((a, b) => +new Date(b.fecha_hora) - +new Date(a.fecha_hora));

  return (
    <div className="min-h-screen bg-(--bone)">
      <RealtimeRefresher />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href={localePath(locale, "/cliente")}
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
        </div>

        {reservas.length === 0 ? (
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
          <>
            {activas.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-lg font-semibold text-(--green-deep) mb-4">
                  {t.reservas.proximas} ({activas.length})
                </h2>
                <div className="space-y-4">
                  {activas.map((reserva) => (
                    <ReservaCard
                      key={reserva.id}
                      reserva={reserva}
                      t={t}
                      locale={locale}
                      revisada={reviewedReservaIds.has(reserva.id)}
                      mostrarReReservar={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {historial.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold text-(--green-deep) mb-4">
                  {t.reservas.historial} ({historial.length})
                </h2>
                <div className="space-y-4">
                  {historial.map((reserva) => (
                    <ReservaCard
                      key={reserva.id}
                      reserva={reserva}
                      t={t}
                      locale={locale}
                      revisada={reviewedReservaIds.has(reserva.id)}
                      mostrarReReservar
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReservaCard({
  reserva,
  t,
  locale,
  revisada,
  mostrarReReservar,
}: {
  reserva: ReservaCliente;
  t: Dictionary['panelCliente'];
  locale: Locale;
  revisada: boolean;
  mostrarReReservar: boolean;
}) {
  const badge = ESTADO_BADGE[reserva.estado] ?? ESTADO_BADGE.pendiente;
  const estadoLabel = t.reservas.estados[reserva.estado] ?? t.reservas.estados.pendiente;
  const fechaStr = new Date(reserva.fecha_hora).toLocaleString(locale, {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const tituloServicio = reserva.servicios?.titulo
    ? ((reserva.servicios.titulo as { es?: string }).es ?? null)
    : null;
  const canCancel = reserva.estado === 'pendiente' || reserva.estado === 'confirmada';
  const esGestion = reserva.tipo_reserva === 'gestion';
  const pagoBadge = reserva.estado_pago !== 'no_aplica' ? PAGO_BADGE[reserva.estado_pago] : null;

  return (
    <div
      className="rounded-xl border p-6 shadow-sm"
      style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Acompañante */}
          {reserva.acompanantes && (
            <Link
              href={localePath(locale, `/${reserva.acompanantes.slug}`)}
              className="font-display text-lg font-medium text-(--green) hover:opacity-80 transition-opacity"
            >
              {reserva.acompanantes.nombre_publico}
            </Link>
          )}

          {/* Servicio / modo de gestión */}
          {tituloServicio && (
            <p className="text-sm text-(--ink)/70 mt-0.5">{tituloServicio}</p>
          )}
          {esGestion && reserva.modo_gestion && (
            <p className="text-sm text-(--ink)/70 mt-0.5">
              {t.reservas.modos[reserva.modo_gestion]}
            </p>
          )}

          {/* Detalles */}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-(--ink)/60">
            <span>{fechaStr}</span>
            <span>·</span>
            <span>{t.shared.modalidades[reserva.modalidad] ?? reserva.modalidad}</span>
            {reserva.zona && (
              <>
                <span>·</span>
                <span>{reserva.zona}</span>
              </>
            )}
          </div>
        </div>

        {/* Badges: estado de la reserva + estado del pago */}
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
              {t.reservas.estadosPago[reserva.estado_pago]}
              {reserva.precio_total_cents != null && (
                <> · {formatEuros(reserva.precio_total_cents, locale)}</>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Contacto + chat (solo reservas confirmadas o completadas) */}
      {(reserva.estado === 'confirmada' || reserva.estado === 'completada') && reserva.acompanantes && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-wrap gap-2">
            <Link
              href={localePath(locale, "/cliente/mensajes")}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t.shared.irAlChat}
            </Link>
            {reserva.estado === 'confirmada' && reserva.acompanantes.whatsapp && (
              <a
                href={`https://wa.me/${reserva.acompanantes.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
              >
                {t.shared.whatsapp}
              </a>
            )}
            {reserva.estado === 'confirmada' && reserva.acompanantes.email_contacto && (
              <a
                href={`mailto:${reserva.acompanantes.email_contacto}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
              >
                {t.shared.email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Acciones: pagar / ver detalle / cancelar */}
      {(canCancel || reserva.estado_pago === 'pendiente_pago') && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-wrap gap-2">
            {reserva.estado_pago === 'pendiente_pago' && (
              <form action={iniciarPagoReserva}>
                <input type="hidden" name="reserva_id" value={reserva.id} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                >
                  {t.reservas.pagar}
                </button>
              </form>
            )}
            {canCancel && (
              <form
                action={esGestion ? cancelarReservaGestion : cancelarReserva}
              >
                <input type="hidden" name="reserva_id" value={reserva.id} />
                <button
                  type="submit"
                  className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--line)', color: 'rgba(43,39,36,0.6)', background: 'transparent' }}
                >
                  {t.reservas.cancelar}
                </button>
              </form>
            )}
          </div>
          {canCancel && esGestion && (
            <p className="text-xs text-(--ink)/40 mt-2">{t.reservas.cancelarNota}</p>
          )}
        </div>
      )}

      {/* Enlace al detalle + re-reservar */}
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href={localePath(locale, `/cliente/reservas/${reserva.id}`)}
          className="text-sm text-(--green) hover:opacity-70 transition-opacity"
        >
          {t.reservas.verDetalle} →
        </Link>
        {mostrarReReservar && esGestion && reserva.acompanantes && (
          <Link
            href={localePath(locale, `/${reserva.acompanantes.slug}/reservar?desde=${reserva.id}`)}
            className="text-sm text-(--terra) hover:opacity-70 transition-opacity"
          >
            ↻ {t.reservas.reReservar}
          </Link>
        )}
      </div>

      {/* Acción dejar reseña */}
      {reserva.estado === 'completada' && !revisada && reserva.acompanantes && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
          <a
            href={localePath(locale, `/${reserva.acompanantes.slug}/resena?reserva_id=${reserva.id}`)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
          >
            {t.reservas.dejarResena}
          </a>
        </div>
      )}
    </div>
  );
}
