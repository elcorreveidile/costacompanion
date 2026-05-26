import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { Anunciante, CategoriaAnunciante } from '@/types/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CAT_LABEL: Record<CategoriaAnunciante, string> = {
  inmobiliaria: 'Inmobiliaria',
  salud:        'Salud',
  legal:        'Legal',
  restauracion: 'Restauración',
  comercio:     'Comercio',
  otros:        'Otros',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('anunciantes')
    .select('nombre_negocio, descripcion, categoria, zona')
    .eq('slug', slug)
    .eq('activo', true)
    .single() as { data: { nombre_negocio: string; descripcion: Record<string, string> | null; categoria: string; zona: string | null } | null; error: null };

  if (!data) return { title: 'Local Partner | Costa Companion' };

  const desc = (data.descripcion ?? {}) as { es?: string };
  const zonaStr = data.zona ? ` · ${data.zona}` : '';

  return {
    title: `${data.nombre_negocio} | Local Partners Costa Companion`,
    description: desc.es ?? `${CAT_LABEL[data.categoria as CategoriaAnunciante]}${zonaStr} — Local Partner en Costa del Sol`,
  };
}

export default async function LocalPartnerPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('anunciantes')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (!data) notFound();

  const an = data as unknown as Anunciante;
  const desc = (an.descripcion ?? {}) as { es?: string; en?: string };
  const whatsappNum = an.whatsapp?.replace(/\D/g, '');
  const mapsHref = an.direccion
    ? `https://maps.google.com/?q=${encodeURIComponent(an.direccion)}`
    : null;

  return (
    <div className="min-h-screen bg-(--bone)">
      {/* Hero */}
      <section className="py-12 px-4" style={{ background: 'var(--green)' }}>
        <div className="max-w-3xl mx-auto">
          <Link
            href="/local-partners"
            className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(247,242,233,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Local Partners
          </Link>

          <div className="flex items-center gap-5">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-xl shrink-0 overflow-hidden"
              style={{ border: '2px solid rgba(247,242,233,0.2)' }}
            >
              {an.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={an.logo_url}
                  alt={an.nombre_negocio}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/images/local-partner-placeholder.png"
                  alt="Local Partner"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div>
              {an.plan === 'destacado' && (
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2"
                  style={{ background: 'rgba(201,123,74,0.25)', color: 'var(--terra)' }}
                >
                  ★ Destacado
                </span>
              )}
              <h1
                className="font-display text-3xl font-semibold leading-tight"
                style={{ color: 'var(--bone)' }}
              >
                {an.nombre_negocio}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-sm px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(247,242,233,0.12)', color: 'rgba(247,242,233,0.8)' }}
                >
                  {CAT_LABEL[an.categoria]}
                </span>
                {an.zona && (
                  <span className="text-sm" style={{ color: 'rgba(247,242,233,0.6)' }}>
                    📍 {an.zona}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Descripción */}
        {(desc.es || desc.en) && (
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <h2 className="font-display text-lg font-semibold text-(--green) mb-3">Sobre nosotros</h2>
            {desc.es && <p className="text-(--ink)/80 leading-relaxed">{desc.es}</p>}
            {desc.en && desc.es && <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--line)' }} />}
            {desc.en && (
              <p className="text-(--ink)/70 leading-relaxed italic text-sm">{desc.en}</p>
            )}
          </div>
        )}

        {/* Contacto */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <h2 className="font-display text-lg font-semibold text-(--green) mb-4">Contacto</h2>

          <div className="space-y-3 mb-5">
            {an.direccion && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--terra)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <a
                  href={mapsHref!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-(--ink)/70 hover:text-(--ink) transition-colors leading-relaxed"
                >
                  {an.direccion}
                </a>
              </div>
            )}

            {an.telefono && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--terra)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a
                  href={`tel:${an.telefono}`}
                  className="text-sm text-(--ink)/70 hover:text-(--ink) transition-colors"
                >
                  {an.telefono}
                </a>
              </div>
            )}

            {an.email && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--terra)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a
                  href={`mailto:${an.email}`}
                  className="text-sm text-(--ink)/70 hover:text-(--ink) transition-colors"
                >
                  {an.email}
                </a>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            {whatsappNum && (
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'rgba(37,211,102,0.12)', color: '#128c7e', border: '1px solid rgba(37,211,102,0.2)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
            {an.telefono && (
              <a
                href={`tel:${an.telefono}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1px solid var(--line)' }}
              >
                Llamar
              </a>
            )}
            {an.email && (
              <a
                href={`mailto:${an.email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1px solid var(--line)' }}
              >
                Email
              </a>
            )}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'rgba(66,133,244,0.1)', color: '#2563eb', border: '1px solid rgba(66,133,244,0.15)' }}
              >
                Ver en mapa
              </a>
            )}
            {an.web && (
              <a
                href={an.web}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Sitio web
              </a>
            )}
          </div>
        </div>

        {/* CTA volver */}
        <div className="text-center pt-4">
          <Link
            href="/local-partners"
            className="text-sm text-(--ink)/50 hover:text-(--ink) transition-colors"
          >
            ← Ver todos los Local Partners
          </Link>
        </div>
      </div>
    </div>
  );
}
