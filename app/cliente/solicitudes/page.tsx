import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RealtimeRefresher } from '@/components/RealtimeRefresher';
import { getSessionUser } from '@/lib/auth/session';
import { getSolicitudesDeCliente } from '@/lib/db/queries/cliente';
import type { EstadoSolicitud } from '@/types/supabase';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

const ESTADO_BADGE: Record<EstadoSolicitud, { bg: string; color: string }> = {
  pendiente: { bg: 'var(--terra-soft)', color: 'var(--terra)' },
  aceptada: { bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
};

export const metadata = { title: 'Mis solicitudes | Costa Companion' };

export default async function ClienteSolicitudesPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelCliente;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const solicitudes = await getSolicitudesDeCliente(user.id);

  return (
    <div className="min-h-screen bg-(--bone)">
      <RealtimeRefresher />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
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
            {t.solicitudes.h1}
          </h1>
        </div>

        {solicitudes.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">{t.solicitudes.vacioTitulo}</p>
            <p className="text-(--ink)/30 text-sm mt-2">
              {t.solicitudes.vacioTexto}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map((solicitud) => {
              const badge = ESTADO_BADGE[solicitud.estado] ?? ESTADO_BADGE.pendiente;
              const estadoLabel = t.solicitudes.estados[solicitud.estado] ?? t.solicitudes.estados.pendiente;
              const fechaStr = solicitud.fecha_hora_deseada
                ? new Date(solicitud.fecha_hora_deseada).toLocaleString(locale, {
                    weekday: 'short', day: 'numeric', month: 'short',
                    year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                : null;

              return (
                <div
                  key={solicitud.id}
                  className="rounded-xl border p-6 shadow-sm"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Acompañante */}
                      {solicitud.acompanantes && (
                        <Link
                          href={localePath(locale, `/${solicitud.acompanantes.slug}`)}
                          className="font-display text-lg font-medium text-(--green) hover:opacity-80 transition-opacity"
                        >
                          {solicitud.acompanantes.nombre_publico}
                        </Link>
                      )}

                      {/* Descripción */}
                      <p className="text-sm text-(--ink)/80 mt-1 leading-relaxed">
                        {solicitud.descripcion}
                      </p>

                      {/* Detalles */}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-(--ink)/60">
                        {fechaStr && <span>{t.solicitudes.fechaDeseada}: {fechaStr}</span>}
                        <span>{t.shared.modalidades[solicitud.modalidad] ?? solicitud.modalidad}</span>
                        {solicitud.zona && <span>{solicitud.zona}</span>}
                      </div>

                      {/* Precio propuesto (si fue aceptada) */}
                      {solicitud.estado === 'aceptada' && solicitud.precio_propuesto !== null && (
                        <p className="text-sm font-medium text-(--green) mt-2">
                          {t.solicitudes.precioPropuesto}: {solicitud.precio_propuesto}€
                        </p>
                      )}
                    </div>

                    {/* Badge de estado */}
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {estadoLabel}
                    </span>
                  </div>

                  {/* Chat (solicitudes aceptadas) */}
                  {solicitud.estado === 'aceptada' && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
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
                    </div>
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
