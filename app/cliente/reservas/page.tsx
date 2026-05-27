import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cancelarReserva } from '@/lib/reservas/actions';
import { RealtimeRefresher } from '@/components/RealtimeRefresher';
import type { EstadoReserva, Modalidad } from '@/types/supabase';

interface AcompananteJoin {
  nombre_publico: string;
  slug: string;
  email_contacto: string | null;
  whatsapp: string | null;
}

interface ServicioJoin {
  titulo: { es?: string; en?: string } | null;
}

interface ReservaConJoins {
  id: string;
  fecha_hora: string;
  modalidad: Modalidad;
  zona: string | null;
  estado: EstadoReserva;
  acompanantes: AcompananteJoin | null;
  servicios: ServicioJoin | null;
}

const ESTADO_BADGE: Record<EstadoReserva, { label: string; bg: string; color: string }> = {
  pendiente: { label: 'Pendiente', bg: 'var(--terra-soft)', color: 'var(--terra)' },
  confirmada: { label: 'Confirmada', bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { label: 'Rechazada', bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
  cancelada: { label: 'Cancelada', bg: 'rgba(43,39,36,0.08)', color: 'rgba(43,39,36,0.5)' },
  completada: { label: 'Completada', bg: 'rgba(34,70,40,0.12)', color: 'var(--green-deep)' },
};

export const metadata = { title: 'Mis reservas | Costa Companion' };

interface PageProps {
  searchParams: Promise<{ nueva?: string }>;
}

export default async function ClienteReservasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nuevaReserva = params.nueva === '1';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: reservasData } = await supabase
    .from('reservas')
    .select('id, fecha_hora, modalidad, zona, estado, acompanantes(nombre_publico, slug, email_contacto, whatsapp), servicios(titulo)')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false });

  const reservas = (reservasData ?? []) as unknown as ReservaConJoins[];

  // Fetch all reviews by this user to know which reservations are already reviewed
  const { data: resenasData } = await supabase
    .from('resenas')
    .select('reserva_id')
    .eq('cliente_id', user.id);

  const reviewedReservaIds = new Set<string>(
    ((resenasData ?? []) as { reserva_id: string | null }[])
      .map((r) => r.reserva_id)
      .filter((id): id is string => id !== null)
  );

  return (
    <div className="min-h-screen bg-(--bone)">
      <RealtimeRefresher table="reservas" filter={`cliente_id=eq.${user.id}`} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Banner de confirmación */}
        {nuevaReserva && (
          <div
            className="mb-6 rounded-lg p-4 text-sm"
            style={{ background: 'rgba(44,74,59,.1)', border: '1px solid rgba(44,74,59,.25)', color: 'var(--green)' }}
          >
            <p className="font-medium mb-0.5">¡Solicitud enviada!</p>
            <p>Hemos enviado tu solicitud. Tu acompañante la revisará y te confirmará en breve. Mientras tanto, puedes escribirle por el chat.</p>
          </div>
        )}

        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
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
              Mis reservas
            </h1>
          </div>
        </div>

        {reservas.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">No tienes reservas todavía</p>
            <p className="text-(--ink)/30 text-sm mt-2">
              Visita el perfil de un acompañante y haz click en &ldquo;Reservar cita&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map((reserva) => {
              const badge = ESTADO_BADGE[reserva.estado] ?? ESTADO_BADGE.pendiente;
              const fechaStr = new Date(reserva.fecha_hora).toLocaleString('es-ES', {
                weekday: 'short', day: 'numeric', month: 'short',
                year: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              const tituloServicio = reserva.servicios?.titulo
                ? ((reserva.servicios.titulo as { es?: string }).es ?? null)
                : null;
              const canCancel = reserva.estado === 'pendiente' || reserva.estado === 'confirmada';

              return (
                <div
                  key={reserva.id}
                  className="rounded-xl border p-6 shadow-sm"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Acompañante */}
                      {reserva.acompanantes && (
                        <Link
                          href={`/${reserva.acompanantes.slug}`}
                          className="font-display text-lg font-medium text-(--green) hover:opacity-80 transition-opacity"
                        >
                          {reserva.acompanantes.nombre_publico}
                        </Link>
                      )}

                      {/* Servicio */}
                      {tituloServicio && (
                        <p className="text-sm text-(--ink)/70 mt-0.5">{tituloServicio}</p>
                      )}

                      {/* Detalles */}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-(--ink)/60">
                        <span>{fechaStr}</span>
                        <span>·</span>
                        <span className="capitalize">{reserva.modalidad}</span>
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
                      {badge.label}
                    </span>
                  </div>

                  {/* Contacto + chat (solo reservas confirmadas o completadas) */}
                  {(reserva.estado === 'confirmada' || reserva.estado === 'completada') && reserva.acompanantes && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/cliente/mensajes"
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Ir al chat
                        </Link>
                        {reserva.estado === 'confirmada' && reserva.acompanantes.whatsapp && (
                          <a
                            href={`https://wa.me/${reserva.acompanantes.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                          >
                            WhatsApp
                          </a>
                        )}
                        {reserva.estado === 'confirmada' && reserva.acompanantes.email_contacto && (
                          <a
                            href={`mailto:${reserva.acompanantes.email_contacto}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
                          >
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acción cancelar */}
                  {canCancel && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                      <form action={cancelarReserva}>
                        <input type="hidden" name="reserva_id" value={reserva.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                          style={{ borderColor: 'var(--line)', color: 'rgba(43,39,36,0.6)', background: 'transparent' }}
                        >
                          Cancelar reserva
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Acción dejar reseña */}
                  {reserva.estado === 'completada' && !reviewedReservaIds.has(reserva.id) && reserva.acompanantes && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                      <a
                        href={`/${reserva.acompanantes.slug}/resena?reserva_id=${reserva.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                      >
                        Dejar reseña
                      </a>
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
