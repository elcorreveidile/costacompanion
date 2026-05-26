import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { EstadoSolicitud, Modalidad } from '@/types/supabase';

interface AcompananteJoin {
  nombre_publico: string;
  slug: string;
}

interface SolicitudConJoins {
  id: string;
  descripcion: string;
  fecha_hora_deseada: string | null;
  modalidad: Modalidad;
  zona: string | null;
  precio_propuesto: number | null;
  estado: EstadoSolicitud;
  acompanantes: AcompananteJoin | null;
}

const ESTADO_BADGE: Record<EstadoSolicitud, { label: string; bg: string; color: string }> = {
  pendiente: { label: 'Pendiente', bg: 'var(--terra-soft)', color: 'var(--terra)' },
  aceptada: { label: 'Aceptada', bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { label: 'Rechazada', bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
};

export const metadata = { title: 'Mis solicitudes | Costa Companion' };

export default async function ClienteSolicitudesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: solicitudesData } = await supabase
    .from('solicitudes')
    .select('id, descripcion, fecha_hora_deseada, modalidad, zona, precio_propuesto, estado, acompanantes(nombre_publico, slug)')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false });

  const solicitudes = (solicitudesData ?? []) as unknown as SolicitudConJoins[];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href="/cliente"
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al panel
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            Mis solicitudes
          </h1>
        </div>

        {solicitudes.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">No tienes solicitudes todavía</p>
            <p className="text-(--ink)/30 text-sm mt-2">
              Visita el perfil de un acompañante y haz click en &ldquo;Solicitud a medida&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map((solicitud) => {
              const badge = ESTADO_BADGE[solicitud.estado] ?? ESTADO_BADGE.pendiente;
              const fechaStr = solicitud.fecha_hora_deseada
                ? new Date(solicitud.fecha_hora_deseada).toLocaleString('es-ES', {
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
                          href={`/${solicitud.acompanantes.slug}`}
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
                        {fechaStr && <span>Fecha deseada: {fechaStr}</span>}
                        <span className="capitalize">{solicitud.modalidad}</span>
                        {solicitud.zona && <span>{solicitud.zona}</span>}
                      </div>

                      {/* Precio propuesto (si fue aceptada) */}
                      {solicitud.estado === 'aceptada' && solicitud.precio_propuesto !== null && (
                        <p className="text-sm font-medium text-(--green) mt-2">
                          Precio propuesto: {solicitud.precio_propuesto}€
                        </p>
                      )}
                    </div>

                    {/* Badge de estado */}
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
