import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { confirmarReserva, rechazarReserva, completarReserva } from '@/lib/reservas/actions';
import type { EstadoReserva, Modalidad } from '@/types/supabase';

interface ProfileJoin {
  nombre: string | null;
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
  profiles: ProfileJoin | null;
  servicios: ServicioJoin | null;
}

const ESTADO_BADGE: Record<EstadoReserva, { label: string; bg: string; color: string }> = {
  pendiente: { label: 'Pendiente', bg: 'var(--terra-soft)', color: 'var(--terra)' },
  confirmada: { label: 'Confirmada', bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { label: 'Rechazada', bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
  cancelada: { label: 'Cancelada', bg: 'rgba(43,39,36,0.08)', color: 'rgba(43,39,36,0.5)' },
  completada: { label: 'Completada', bg: 'rgba(34,70,40,0.12)', color: 'var(--green-deep)' },
};

export const metadata = { title: 'Reservas recibidas | Costa Companion' };

export default async function AcompananteReservasPage() {
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

  const { data: reservasData } = await supabase
    .from('reservas')
    .select('id, fecha_hora, modalidad, zona, estado, profiles(nombre), servicios(titulo)')
    .eq('acompanante_id', acompananteId)
    .order('created_at', { ascending: false });

  const reservas = (reservasData ?? []) as unknown as ReservaConJoins[];

  return (
    <div className="min-h-screen bg-(--bone)">
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
            Reservas recibidas
          </h1>
        </div>

        {reservas.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">No tienes reservas todavía</p>
            <p className="text-(--ink)/30 text-sm mt-2">
              Las reservas de tus clientes aparecerán aquí.
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
                        {reserva.profiles?.nombre ?? 'Cliente'}
                      </p>

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
                          Confirmar
                        </button>
                      </form>
                      <form action={rechazarReserva}>
                        <input type="hidden" name="reserva_id" value={reserva.id} />
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

                  {reserva.estado === 'confirmada' && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                      <form action={completarReserva}>
                        <input type="hidden" name="reserva_id" value={reserva.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green-deep)', color: 'var(--bone)' }}
                        >
                          Marcar completada
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
