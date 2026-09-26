import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentos, tiposGestion } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getReservaDetalleCliente } from '@/lib/db/queries/cliente';
import type { EstadoReserva } from '@/types/supabase';
import { cancelarReservaGestion } from '@/lib/reservas/cancelacion';
import { iniciarPagoReserva } from '@/lib/reservas/pagos';
import { videoEnVentana } from '@/lib/reservas/videollamada';
import { formatEuros } from '@/lib/precios';
import { getI18n } from '@/lib/i18n/server';
import { languageName, localePath } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';
import DocumentosReserva from './DocumentosReserva';

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

export const dynamic = 'force-dynamic';

export default async function ReservaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc_error?: string }>;
}) {
  const { id } = await params;
  const { doc_error: docError } = await searchParams;
  const { locale, dict } = await getI18n();
  const t = dict.panelCliente;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const reserva = await getReservaDetalleCliente(user.id, id);
  if (!reserva) notFound();

  // Documentos de citación (sin los borrados): la descarga real pasa por
  // /api/documentos/[id], que re-autoriza en cada petición.
  const docs = await db
    .select({
      id: documentos.id,
      nombre: documentos.nombreOriginal,
      bytes: documentos.bytes,
      createdAt: documentos.createdAt,
    })
    .from(documentos)
    .where(and(eq(documentos.reservaId, reserva.id), isNull(documentos.eliminadoAt)))
    .orderBy(desc(documentos.createdAt));

  // Etiqueta del tipo de gestión (catálogo) e idioma de la gestión.
  const tipoGestionNombre = reserva.tipo_gestion_key
    ? await db
        .select({ nombre: tiposGestion.nombre })
        .from(tiposGestion)
        .where(eq(tiposGestion.key, reserva.tipo_gestion_key))
        .limit(1)
        .then((rows) => pickLang(rows[0]?.nombre as Record<string, unknown> | null, locale) || reserva.tipo_gestion_key)
    : null;

  const badge = ESTADO_BADGE[reserva.estado] ?? ESTADO_BADGE.pendiente;
  const pagoBadge = reserva.estado_pago !== 'no_aplica' ? PAGO_BADGE[reserva.estado_pago] : null;
  const fechaStr = new Date(reserva.fecha_hora).toLocaleString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const canCancel = reserva.estado === 'pendiente' || reserva.estado === 'confirmada';
  const desglose = reserva.precio_desglose;
  // Petición en cola (Fase C1): sin acompañante asignado todavía.
  const esCola = reserva.tipo_reserva === 'gestion' && !reserva.acompanantes;
  const expirada = reserva.cancelada_motivo === 'expirada_pago';

  // Videollamada: botón visible desde 15 min antes hasta 2 h después (server-rendered
  // per-request; la página es force-dynamic).
  const conVideo = !!reserva.enlace_video && reserva.estado === 'confirmada';
  const videoActivo = conVideo && videoEnVentana(new Date(reserva.fecha_hora));

  const lineaLabel: Record<string, string> = {
    base: t.detalle.lineaBase,
    zona: t.detalle.lineaZona,
    urgencia: t.detalle.lineaUrgencia,
  };

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Navegación */}
        <div className="mb-6">
          <Link
            href={localePath(locale, '/cliente/reservas')}
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.detalle.volver}
          </Link>
        </div>

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-(--green)">
              {reserva.acompanantes?.nombre_publico ?? t.reservas.sinAsignar}
            </h1>
            <p className="text-(--ink)/60 text-sm mt-1">{fechaStr}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: badge.bg, color: badge.color }}
            >
              {t.reservas.estados[reserva.estado] ?? reserva.estado}
            </span>
            {pagoBadge && (
              <span
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: pagoBadge.bg, color: pagoBadge.color }}
              >
                {t.reservas.estadosPago[reserva.estado_pago]}
              </span>
            )}
          </div>
        </div>

        {expirada && (
          <div
            className="rounded-xl border p-4 mb-6 text-sm"
            style={{ background: 'var(--terra-soft)', borderColor: 'transparent', color: 'var(--terra)' }}
          >
            {t.detalle.expirada}
          </div>
        )}

        {esCola && reserva.estado === 'pendiente' && (
          <div
            className="rounded-xl border p-4 mb-6 text-sm"
            style={{ background: 'var(--terra-soft)', borderColor: 'transparent', color: 'var(--terra)' }}
          >
            {t.reservas.sinAsignarNota}
          </div>
        )}

        {/* Detalles */}
        <div
          className="rounded-xl border shadow-sm p-6 mb-6"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <h2 className="font-display text-lg font-medium text-(--green) mb-4">{t.detalle.resumen}</h2>
          <dl className="space-y-2 text-sm">
            {reserva.modo_gestion && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--ink)/50">{t.detalle.modo}</dt>
                <dd className="text-(--ink) text-right">{t.reservas.modos[reserva.modo_gestion]}</dd>
              </div>
            )}
            {tipoGestionNombre && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--ink)/50">{t.detalle.tipoGestion}</dt>
                <dd className="text-(--ink) text-right">{tipoGestionNombre}</dd>
              </div>
            )}
            {reserva.idioma_gestion && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--ink)/50">{t.detalle.idioma}</dt>
                <dd className="text-(--ink) text-right">{languageName(reserva.idioma_gestion, locale)}</dd>
              </div>
            )}
            {reserva.zona && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--ink)/50">{dict.flujos.gestiones.zonaLabel}</dt>
                <dd className="text-(--ink) text-right">{reserva.zona}</dd>
              </div>
            )}
            {reserva.metodo_pago && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--ink)/50">{t.detalle.metodoPago}</dt>
                <dd className="text-(--ink) text-right">{t.detalle.metodos[reserva.metodo_pago]}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Importe / desglose */}
        {desglose && (
          <div
            className="rounded-xl border shadow-sm p-6 mb-6"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <h2 className="font-display text-lg font-medium text-(--green) mb-4">{t.detalle.pagoTitulo}</h2>
            <div className="space-y-2 text-sm">
              {desglose.lineas.map((linea, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span className="text-(--ink)/60">
                    {lineaLabel[linea.key] ?? linea.key}
                    {linea.key === 'base' && desglose.horasFacturadas != null
                      ? ` · ${desglose.horasFacturadas} h`
                      : ''}
                  </span>
                  <span className="text-(--ink)">{formatEuros(linea.importeCents, locale)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-2 border-t font-medium" style={{ borderColor: 'var(--line)' }}>
                <span className="text-(--ink)">{t.detalle.total}</span>
                <span className="text-(--green)">{formatEuros(desglose.totalCents, locale)}</span>
              </div>
              {reserva.reembolso_cents > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-(--ink)/60">{t.detalle.reembolsado}</span>
                  <span className="text-(--green)">{formatEuros(reserva.reembolso_cents, locale)}</span>
                </div>
              )}
              {reserva.politica_aplicada && (
                <p className="text-xs text-(--ink)/40 pt-1">
                  {t.detalle.politica}: {t.detalle.politicas[reserva.politica_aplicada]}
                </p>
              )}
              {reserva.no_show && (
                <p className="text-xs text-(--terra) pt-1">{t.detalle.noShow}</p>
              )}
            </div>
          </div>
        )}

        {/* Documentos de citación (Blob privado; descarga firmada 5 min) */}
        <DocumentosReserva
          reservaId={reserva.id}
          bloqueado={esCola}
          docs={docs.map((d) => ({
            id: d.id,
            nombre: d.nombre,
            bytes: d.bytes,
            createdAt: d.createdAt.toISOString(),
          }))}
          t={t.documentos}
          locale={locale}
          errorKey={docError}
        />

        {/* Acciones */}
        {(canCancel || reserva.estado_pago === 'pendiente_pago') && (
          <div
            className="rounded-xl border shadow-sm p-6 mb-6"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex flex-wrap gap-2">
              {reserva.estado_pago === 'pendiente_pago' && reserva.precio_total_cents != null && (
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
                <form action={cancelarReservaGestion}>
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
            {canCancel && (
              <p className="text-xs text-(--ink)/40 mt-3">{t.reservas.cancelarNota}</p>
            )}
          </div>
        )}

        {/* Videollamada (enlace en ventana −15 min … +2 h) */}
        {conVideo && videoActivo && (
          <a
            href={reserva.enlace_video ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t.detalle.enlaceVideo}
          </a>
        )}
        {conVideo && !videoActivo && (
          <p className="text-xs text-(--ink)/40">{t.detalle.enlaceVideoNota}</p>
        )}
      </div>
    </div>
  );
}
