import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { aceptarSolicitud, rechazarSolicitud } from '@/lib/solicitudes/actions';
import { RealtimeRefresher } from '@/components/RealtimeRefresher';
import type { EstadoSolicitud, Modalidad } from '@/types/supabase';

interface ProfileJoin {
  nombre: string | null;
}

interface SolicitudConJoins {
  id: string;
  descripcion: string;
  fecha_hora_deseada: string | null;
  modalidad: Modalidad;
  zona: string | null;
  precio_propuesto: number | null;
  estado: EstadoSolicitud;
  profiles: ProfileJoin | null;
}

const ESTADO_BADGE: Record<EstadoSolicitud, { label: string; bg: string; color: string }> = {
  pendiente: { label: 'Pendiente', bg: 'var(--terra-soft)', color: 'var(--terra)' },
  aceptada: { label: 'Aceptada', bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { label: 'Rechazada', bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
};

export const metadata = { title: 'Solicitudes recibidas | Costa Companion' };

export default async function AcompananteSolicitudesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Obtener acompanante_id
  const { data: acompananteData } = await supabase
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) {
    redirect('/acompanante');
  }

  const acompananteId = (acompananteData as unknown as { id: string }).id;

  const { data: solicitudesData } = await supabase
    .from('solicitudes')
    .select('id, descripcion, fecha_hora_deseada, modalidad, zona, precio_propuesto, estado, profiles(nombre)')
    .eq('acompanante_id', acompananteId)
    .order('created_at', { ascending: false });

  const solicitudes = (solicitudesData ?? []) as unknown as SolicitudConJoins[];

  return (
    <div className="min-h-screen bg-(--bone)">
      <RealtimeRefresher table="solicitudes" filter={`acompanante_id=eq.${acompananteId}`} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href="/acompanante"
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al panel
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            Solicitudes recibidas
          </h1>
        </div>

        {solicitudes.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">No tienes solicitudes todavía</p>
            <p className="text-(--ink)/30 text-sm mt-2">
              Las solicitudes a medida de tus clientes aparecerán aquí.
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
                      {/* Nombre cliente */}
                      <p className="font-display text-lg font-medium text-(--green)">
                        {solicitud.profiles?.nombre ?? 'Cliente'}
                      </p>

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

                      {/* Precio propuesto si fue aceptada */}
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

                  {/* Chat (solicitudes aceptadas) */}
                  {solicitud.estado === 'aceptada' && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                      <Link
                        href="/acompanante/mensajes"
                        className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Ir al chat
                      </Link>
                    </div>
                  )}

                  {/* Acciones según estado */}
                  {solicitud.estado === 'pendiente' && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--line)' }}>
                      {/* Aceptar con precio */}
                      <form action={aceptarSolicitud} className="flex gap-3 items-end flex-wrap">
                        <input type="hidden" name="solicitud_id" value={solicitud.id} />
                        <div>
                          <label className="block text-xs font-medium text-(--ink)/60 mb-1">
                            Precio propuesto (€) *
                          </label>
                          <input
                            type="number"
                            name="precio_propuesto"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="px-3 py-2 rounded-lg border text-sm bg-(--bone) w-32"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}
                        >
                          Aceptar solicitud
                        </button>
                      </form>

                      {/* Rechazar */}
                      <form action={rechazarSolicitud}>
                        <input type="hidden" name="solicitud_id" value={solicitud.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                          style={{ borderColor: 'var(--line)', color: 'rgba(43,39,36,0.6)', background: 'transparent' }}
                        >
                          Rechazar
                        </button>
                      </form>
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
