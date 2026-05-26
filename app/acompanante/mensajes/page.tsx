'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { enviarMensaje, marcarMensajesLeidos } from '@/lib/mensajes/actions';
import { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';

interface Mensaje {
  id: string;
  emisor_id: string;
  texto: string;
  leido: boolean;
  created_at: string;
}

interface Conversacion {
  otherUserId: string;
  otherUserName: string;
  acompanante: {
    id: string;
    nombre_publico: string;
    foto_url: string | null;
    slug: string;
  } | null;
  ultimoMensaje: string;
  ultimoMensajeFecha: string;
  tieneNoLeidos: boolean;
  reserva_id: string | null;
  solicitud_id: string | null;
  mensajes: Mensaje[];
}

export default function AcompananteMensajesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<Conversacion | null>(null);
  const [textoMensaje, setTextoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar usuario
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);
      cargarConversaciones(user.id);
    });
  }, [router, supabase]);

  // Cargar conversaciones
  const cargarConversaciones = async (uid: string) => {
    setCargando(true);
    try {
      const response = await fetch('/api/mensajes/conversaciones');
      if (!response.ok) throw new Error('Error cargando conversaciones');
      const data = await response.json();
      setConversaciones(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Error cargando conversaciones');
    } finally {
      setCargando(false);
    }
  };

  // Cargar mensajes de una conversación
  const cargarMensajes = async (otherUserId: string) => {
    try {
      const response = await fetch(`/api/mensajes/conversacion?otherUserId=${otherUserId}`);
      if (!response.ok) throw new Error('Error cargando mensajes');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  };

  // Seleccionar conversación
  const seleccionarConversacion = async (conv: Conversacion) => {
    setConversacionActiva(conv);

    // Marcar mensajes como leídos
    if (conv.tieneNoLeidos && userId) {
      await marcarMensajesLeidos(conv.otherUserId);
      // Actualizar estado local
      setConversaciones((prev) =>
        prev.map((c) =>
          c.otherUserId === conv.otherUserId ? { ...c, tieneNoLeidos: false } : c
        )
      );
    }

    // Cargar mensajes
    const mensajes = await cargarMensajes(conv.otherUserId);
    setConversaciones((prev) =>
      prev.map((c) =>
        c.otherUserId === conv.otherUserId ? { ...c, mensajes } : c
      )
    );
    setConversacionActiva((prev) => ({ ...prev!, mensajes }));
  };

  // Enviar mensaje
  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoMensaje.trim() || !conversacionActiva || enviando) return;

    setEnviando(true);
    setError(null);

    const formData = new FormData();
    formData.append('receptor_id', conversacionActiva.otherUserId);
    formData.append('texto', textoMensaje.trim());
    if (conversacionActiva.reserva_id) {
      formData.append('reserva_id', conversacionActiva.reserva_id);
    }
    if (conversacionActiva.solicitud_id) {
      formData.append('solicitud_id', conversacionActiva.solicitud_id);
    }

    try {
      const result = await enviarMensaje(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setTextoMensaje('');
        // Recargar mensajes
        const mensajes = await cargarMensajes(conversacionActiva.otherUserId);
        setConversacionActiva((prev) => ({ ...prev!, mensajes }));
      }
    } catch (err) {
      setError('Error enviando mensaje');
    } finally {
      setEnviando(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel: RealtimeChannel = supabase
      .channel('mensajes-acompanante')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `receptor_id=eq.${userId}`,
        },
        () => {
          // Recargar conversaciones cuando llega un nuevo mensaje
          cargarConversaciones(userId);
          if (conversacionActiva) {
            cargarMensajes(conversacionActiva.otherUserId).then((mensajes) => {
              setConversacionActiva((prev) => ({ ...prev!, mensajes }));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, conversacionActiva]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-(--bone) flex items-center justify-center">
        <p className="text-(--ink)/50">Cargando mensajes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href="/acompanante"
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al panel
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            Mis mensajes
          </h1>
          <p className="text-(--ink)/60">
            {conversaciones.length} conversación{conversaciones.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {conversaciones.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">No tienes conversaciones todavía</p>
            <p className="text-(--ink)/30 text-sm mt-2">
              Cuando un cliente te reserve o envíe una solicitud, los mensajes aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lista de conversaciones */}
            <div
              className="rounded-xl border overflow-hidden shadow-sm"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
                <h2 className="font-medium text-(--ink)">Conversaciones</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {conversaciones.map((conv) => (
                  <button
                    key={conv.otherUserId}
                    onClick={() => seleccionarConversacion(conv)}
                    className="w-full p-4 text-left hover:bg-(--bone-5) transition-colors"
                    style={{
                      background:
                        conversacionActiva?.otherUserId === conv.otherUserId
                          ? 'var(--bone-2)'
                          : 'var(--bone)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-(--ink)/30">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-(--ink) truncate">
                            {conv.otherUserName}
                          </p>
                          {conv.tieneNoLeidos && (
                            <span
                              className="shrink-0 w-2 h-2 rounded-full"
                              style={{ background: 'var(--terra)' }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-(--ink)/50 truncate mt-1">
                          {conv.ultimoMensaje}
                        </p>
                        <p className="text-xs text-(--ink)/30 mt-1">
                          {new Date(conv.ultimoMensajeFecha).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        {(conv.reserva_id || conv.solicitud_id) && (
                          <div className="flex gap-1 mt-1">
                            {conv.reserva_id && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                                Reserva
                              </span>
                            )}
                            {conv.solicitud_id && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--terra)', color: 'var(--bone)' }}>
                                Solicitud
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vista de conversación */}
            {conversacionActiva ? (
              <div className="md:col-span-2">
                <div
                  className="rounded-xl border overflow-hidden shadow-sm flex flex-col"
                  style={{ borderColor: 'var(--line)', height: '600px' }}
                >
                  {/* Header */}
                  <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-(--ink)/30">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-(--ink)">
                        {conversacionActiva.otherUserName}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {conversacionActiva.reserva_id && (
                          <span className="text-xs" style={{ color: 'var(--green)' }}>
                            · Reserva vinculada
                          </span>
                        )}
                        {conversacionActiva.solicitud_id && (
                          <span className="text-xs" style={{ color: 'var(--terra)' }}>
                            · Solicitud vinculada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversacionActiva.mensajes.length === 0 ? (
                      <div className="text-center text-(--ink)/40 py-8">
                        <p>Esta conversación está vacía</p>
                        <p className="text-sm mt-1">Envía el primer mensaje</p>
                      </div>
                    ) : (
                      conversacionActiva.mensajes.map((msg) => {
                        const esMio = msg.emisor_id === userId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-2xl ${
                                esMio
                                  ? 'text-(--bone)'
                                  : 'text-(--ink)'
                              }`}
                              style={{
                                background: esMio ? 'var(--green)' : 'var(--bone-2)',
                              }}
                            >
                              <p className="text-sm leading-relaxed">{msg.texto}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  esMio ? 'text-(--bone)/60' : 'text-(--ink)/40'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Formulario */}
                  <form onSubmit={handleEnviar} className="p-4 border-t" style={{ borderColor: 'var(--line)' }}>
                    {error && (
                      <div
                        className="mb-3 rounded-lg px-4 py-2 text-sm border"
                        style={{ background: 'rgba(201,123,74,0.1)', borderColor: 'var(--terra)', color: 'var(--ink)' }}
                      >
                        {error}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={textoMensaje}
                        onChange={(e) => setTextoMensaje(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                        style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      />
                      <button
                        type="submit"
                        disabled={enviando || !textoMensaje.trim()}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ background: 'var(--green)', color: 'var(--bone)' }}
                      >
                        {enviando ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2">
                <div
                  className="rounded-xl border p-10 text-center"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <p className="text-(--ink)/40">Selecciona una conversación para ver los mensajes</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
