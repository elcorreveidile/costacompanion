import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Anunciante, CategoriaAnunciante } from '@/types/supabase';

const CAT_LABEL: Record<CategoriaAnunciante, string> = {
  inmobiliaria: 'Inmobiliaria',
  salud:        'Salud',
  legal:        'Legal',
  restauracion: 'Restauración',
  comercio:     'Comercio',
  otros:        'Otros',
};

export async function LocalPartnersDestacados() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('anunciantes')
    .select('id, nombre_negocio, descripcion, logo_url, web, whatsapp, telefono, email, categoria, zona, slug, direccion')
    .eq('activo', true)
    .eq('plan', 'destacado')
    .limit(3);

  const lista = (data ?? []) as unknown as Anunciante[];
  if (lista.length === 0) return null;

  return (
    <section className="mt-12 mb-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
        <span className="text-xs font-medium tracking-widest uppercase text-(--ink)/40">Local Partners</span>
        <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {lista.map((an) => {
          const desc = (an.descripcion ?? {}) as { es?: string };
          const whatsappNum = an.whatsapp?.replace(/\D/g, '');
          const mapsHref = an.direccion
            ? `https://maps.google.com/?q=${encodeURIComponent(an.direccion)}`
            : null;
          return (
            <div key={an.id}
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>

              {/* Logo o placeholder */}
              <div className="flex items-center gap-3">
                {an.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={an.logo_url} alt={an.nombre_negocio}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid var(--line)' }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden"
                    style={{ border: '1px solid var(--line)' }}>
                    <Image
                      src="/images/local-partner-placeholder.png"
                      alt="Local Partner"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-(--green) truncate">{an.nombre_negocio}</p>
                  <p className="text-xs text-(--ink)/50">
                    {CAT_LABEL[an.categoria]}{an.zona ? ` · ${an.zona}` : ''}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              {desc.es && (
                <p className="text-xs text-(--ink)/60 leading-relaxed line-clamp-2">{desc.es}</p>
              )}

              {/* Dirección */}
              {an.direccion && (
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.8}
                    style={{ color: 'var(--ink)', opacity: 0.4 }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.5 }}>
                    {an.direccion}
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2 mt-auto flex-wrap">
                <Link href={`/local-partners/${an.slug}`}
                  className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'var(--green)', color: 'var(--bone)', minWidth: '52px' }}>
                  Ver ficha
                </Link>
                {whatsappNum && (
                  <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(37,211,102,0.12)', color: '#128c7e', minWidth: '52px' }}>
                    WhatsApp
                  </a>
                )}
                {mapsHref && (
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(66,133,244,0.1)', color: '#2563eb', minWidth: '52px' }}>
                    Mapa
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center mt-4">
        <Link href="/local-partners"
          className="text-xs text-(--ink)/50 hover:text-(--ink) transition-colors">
          Ver todos los Local Partners →
        </Link>
      </p>
    </section>
  );
}
