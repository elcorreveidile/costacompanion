import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Acompanante, Servicio, PaqueteClases, Resena, ServiceCategory } from '@/types/supabase';
import type { Metadata } from 'next';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServicioConExtras extends Servicio {
  paquetes_clases: PaqueteClases[];
  service_categories: { key: string; nombre: Record<string, string> } | null;
}

interface ResenaConProfile extends Resena {
  profiles: { nombre: string | null } | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const IDIOMAS_MAP: Record<string, string> = {
  es: 'Español', en: 'Inglés', fr: 'Francés', de: 'Alemán',
  nl: 'Neerlandés', ru: 'Ruso', zh: 'Chino', ar: 'Árabe',
  pt: 'Portugués', it: 'Italiano',
};

function Estrellas({ valor, total }: { valor: number | null; total: number }) {
  const rounded = Math.round((valor ?? 0) * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill={star <= rounded ? 'var(--terra)' : 'none'}
          stroke="var(--terra)"
          strokeWidth={1.5}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {total > 0 && (
        <span className="text-sm text-(--ink)/60 ml-1.5">
          {(valor ?? 0).toFixed(1)} ({total} reseña{total !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('acompanantes')
    .select('nombre_publico, bio')
    .eq('slug', slug)
    .eq('activo', true)
    .single() as { data: { nombre_publico: string; bio: Record<string, string> | null } | null; error: null };

  if (!data) {
    return { title: 'Acompañante no encontrado | Costa Companion' };
  }

  const bio = (data.bio ?? {}) as { es?: string };
  const description = bio.es
    ? bio.es.slice(0, 155)
    : `Perfil de ${data.nombre_publico} en Costa Companion.`;

  return {
    title: `${data.nombre_publico} | Costa Companion`,
    description,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AcompananteSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Cargar acompañante
  const { data: rawAcompanante } = await supabase
    .from('acompanantes')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (!rawAcompanante) notFound();

  const acompanante = rawAcompanante as unknown as Acompanante;

  // Cargar servicios activos con paquetes y categoría
  const { data: serviciosData } = await supabase
    .from('servicios')
    .select('*, paquetes_clases(*), service_categories(key, nombre)')
    .eq('acompanante_id', acompanante.id)
    .eq('activo', true);

  const servicios = (serviciosData ?? []) as unknown as ServicioConExtras[];

  // Cargar reseñas aprobadas
  const { data: resenasData } = await supabase
    .from('resenas')
    .select('*, profiles(nombre)')
    .eq('acompanante_id', acompanante.id)
    .eq('aprobada', true)
    .order('created_at', { ascending: false });

  const resenas = (resenasData ?? []) as unknown as ResenaConProfile[];

  const bio = (acompanante.bio ?? {}) as { es?: string; en?: string };

  // Agrupar servicios por categoría
  const serviciosPorCategoria: Record<string, ServicioConExtras[]> = {};
  for (const servicio of servicios) {
    const catKey = servicio.service_categories?.key ?? 'otros';
    if (!serviciosPorCategoria[catKey]) {
      serviciosPorCategoria[catKey] = [];
    }
    serviciosPorCategoria[catKey].push(servicio);
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: 'var(--green)' }}>
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20 flex flex-col md:flex-row items-center gap-10">
          {/* Foto */}
          <div className="shrink-0">
            {acompanante.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={acompanante.foto_url}
                alt={acompanante.nombre_publico}
                className="w-40 h-40 md:w-52 md:h-52 rounded-full object-cover shadow-xl border-4"
                style={{ borderColor: 'rgba(247,242,233,0.3)' }}
              />
            ) : (
              <div
                className="w-40 h-40 md:w-52 md:h-52 rounded-full flex items-center justify-center shadow-xl border-4"
                style={{ background: 'var(--bone-2)', borderColor: 'rgba(247,242,233,0.3)' }}
              >
                <svg className="w-20 h-20 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3" style={{ color: 'var(--bone)' }}>
              {acompanante.nombre_publico}
            </h1>

            {/* Valoración */}
            {acompanante.num_resenas > 0 && (
              <div className="mb-4">
                <Estrellas valor={acompanante.valoracion_media} total={acompanante.num_resenas} />
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {acompanante.destacado && (
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                >
                  Destacado
                </span>
              )}
              {acompanante.interprete_jurado && (
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(247,242,233,0.2)', color: 'var(--bone)', border: '1px solid rgba(247,242,233,0.4)' }}
                >
                  Intérprete jurado
                </span>
              )}
              {acompanante.imparte_clases && (
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(247,242,233,0.2)', color: 'var(--bone)', border: '1px solid rgba(247,242,233,0.4)' }}
                >
                  Imparte clases
                </span>
              )}
            </div>

            {/* Bio */}
            {bio.es && (
              <p className="text-base leading-relaxed max-w-lg" style={{ color: 'rgba(247,242,233,0.85)' }}>
                {bio.es}
              </p>
            )}

            {/* Idiomas */}
            {acompanante.idiomas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {acompanante.idiomas.map((id) => (
                  <span
                    key={id}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(247,242,233,0.15)', color: 'var(--bone)', border: '1px solid rgba(247,242,233,0.3)' }}
                  >
                    {IDIOMAS_MAP[id] ?? id}
                  </span>
                ))}
              </div>
            )}

            {/* Zonas y modalidades */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm justify-center md:justify-start" style={{ color: 'rgba(247,242,233,0.7)' }}>
              {acompanante.zonas.length > 0 && (
                <span>📍 {acompanante.zonas.join(', ')}</span>
              )}
              {acompanante.modalidades.length > 0 && (
                <span>🔄 {acompanante.modalidades.join(', ')}</span>
              )}
              {acompanante.anios_experiencia && (
                <span>🎓 {acompanante.anios_experiencia} años de experiencia</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* ── CTA de contacto ── */}
        <section id="contacto" className="rounded-xl border p-8 text-center shadow-sm" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
          <h2 className="font-display text-2xl font-medium text-(--green) mb-3">
            ¿Listo para contactar?
          </h2>
          <p className="text-(--ink)/70 mb-6 max-w-md mx-auto">
            Solicita cita o contacta directamente para resolver cualquier duda.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#contacto"
              className="px-6 py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              Solicitar cita
            </a>
            {acompanante.email_contacto && (
              <a
                href={`mailto:${acompanante.email_contacto}`}
                className="px-6 py-3 rounded-lg font-medium text-sm border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
              >
                Enviar email
              </a>
            )}
            {acompanante.whatsapp && (
              <a
                href={`https://wa.me/${acompanante.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-medium text-sm border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* ── Servicios ── */}
        {servicios.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-medium text-(--green) mb-6">
              Servicios
            </h2>
            <div className="space-y-8">
              {Object.entries(serviciosPorCategoria).map(([catKey, items]) => (
                <div key={catKey}>
                  <h3 className="text-sm font-medium text-(--ink)/50 uppercase tracking-wide mb-3">
                    {items[0].service_categories
                      ? ((items[0].service_categories.nombre as { es?: string }).es ?? catKey)
                      : catKey}
                  </h3>
                  <div className="space-y-4">
                    {items.map((servicio) => {
                      const titulo = (servicio.titulo as { es?: string; en?: string }).es ?? 'Servicio';
                      const descripcion = (servicio.descripcion as { es?: string } | null)?.es;

                      return (
                        <div
                          key={servicio.id}
                          className="rounded-xl border p-6 shadow-sm"
                          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-(--ink) text-lg">{titulo}</h4>
                              {descripcion && (
                                <p className="text-sm text-(--ink)/70 mt-1 leading-relaxed">{descripcion}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-3 text-sm text-(--ink)/60">
                                <span>{servicio.modalidad}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-display text-xl font-medium text-(--green)">
                                {servicio.precio}€
                              </span>
                              <p className="text-xs text-(--ink)/40 mt-0.5">/{servicio.unidad_precio}</p>
                            </div>
                          </div>

                          {/* Paquetes */}
                          {servicio.es_clase && servicio.paquetes_clases.length > 0 && (
                            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                              <p className="text-xs font-medium text-(--ink)/50 mb-2">Paquetes de sesiones</p>
                              <div className="flex flex-wrap gap-2">
                                {servicio.paquetes_clases.filter((p) => p.activo).map((paq) => (
                                  <div
                                    key={paq.id}
                                    className="px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bone)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                                  >
                                    <span className="font-medium">{paq.num_sesiones} sesiones</span>
                                    <span className="text-(--ink)/50"> — </span>
                                    <span className="text-(--green) font-medium">{paq.precio_total}€</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Reseñas ── */}
        <section>
          <h2 className="font-display text-2xl font-medium text-(--green) mb-6">
            Reseñas
          </h2>

          {resenas.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <p className="text-(--ink)/40 text-lg">Sé el primero en dejar una reseña</p>
              <p className="text-(--ink)/30 text-sm mt-2">
                Las reseñas de clientes verificados aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resenas.map((resena) => (
                <div
                  key={resena.id}
                  className="rounded-xl border p-6 shadow-sm"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-medium text-(--ink)">
                        {resena.profiles?.nombre ?? 'Cliente verificado'}
                      </p>
                      <p className="text-xs text-(--ink)/40">
                        {new Date(resena.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill={star <= resena.puntuacion ? 'var(--terra)' : 'none'}
                          stroke="var(--terra)"
                          strokeWidth={1.5}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {resena.comentario && (
                    <p className="text-sm text-(--ink)/80 leading-relaxed">{resena.comentario}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Aviso legal ── */}
        <footer className="border-t pt-8" style={{ borderColor: 'var(--line)' }}>
          <p className="text-xs text-(--ink)/30 leading-relaxed max-w-2xl">
            Costa Companion actúa exclusivamente como plataforma de intermediación entre clientes y acompañantes lingüísticos independientes.
            Los servicios son prestados directamente por los acompañantes, quienes son profesionales autónomos.
            Costa Companion no es parte de ningún contrato de prestación de servicios entre el cliente y el acompañante.
          </p>
        </footer>
      </div>
    </div>
  );
}
