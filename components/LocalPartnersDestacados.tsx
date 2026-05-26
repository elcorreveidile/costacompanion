import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
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
    .select('id, nombre_negocio, descripcion, logo_url, web, whatsapp, telefono, email, categoria, zona, slug')
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
          return (
            <div key={an.id}
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-3">
                {an.logo_url ? (
                  <img src={an.logo_url} alt={an.nombre_negocio}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid var(--line)' }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg shrink-0"
                    style={{ background: 'var(--bone)', border: '1px solid var(--line)' }} />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-(--green) truncate">{an.nombre_negocio}</p>
                  <p className="text-xs text-(--ink)/50">
                    {CAT_LABEL[an.categoria]}{an.zona ? ` · ${an.zona}` : ''}
                  </p>
                </div>
              </div>

              {desc.es && (
                <p className="text-xs text-(--ink)/60 leading-relaxed line-clamp-2">{desc.es}</p>
              )}

              <div className="flex gap-2 mt-auto">
                {an.web && (
                  <a href={an.web} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                    Web
                  </a>
                )}
                {whatsappNum && (
                  <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(37,211,102,0.12)', color: '#128c7e' }}>
                    WhatsApp
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
