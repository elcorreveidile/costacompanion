import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Anunciante, CategoriaAnunciante } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Local Partners | Costa Companion',
  description: 'Negocios locales recomendados en la Costa del Sol — inmobiliarias, salud, legal, restauración y más.',
};

interface PageProps {
  searchParams: Promise<{ categoria?: string; zona?: string }>;
}

const CATEGORIAS: { value: CategoriaAnunciante; label: string }[] = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'salud',        label: 'Salud' },
  { value: 'legal',        label: 'Legal' },
  { value: 'restauracion', label: 'Restauración' },
  { value: 'comercio',     label: 'Comercio' },
  { value: 'otros',        label: 'Otros' },
];

const ZONAS = ['Estepona', 'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga', 'Otra Costa del Sol'];

const CAT_ICON: Record<CategoriaAnunciante, string> = {
  inmobiliaria: '🏠',
  salud:        '⚕️',
  legal:        '⚖️',
  restauracion: '🍽️',
  comercio:     '🛍️',
  otros:        '📌',
};

function zonaOrder(zona: string | null): number {
  if (!zona) return 4;
  if (zona === 'Estepona') return 1;
  if (zona === 'Marbella') return 2;
  return 3;
}

export default async function LocalPartnersPage({ searchParams }: PageProps) {
  const { categoria, zona } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('anunciantes')
    .select('*')
    .eq('activo', true);

  if (categoria) query = query.eq('categoria', categoria);
  if (zona) query = query.eq('zona', zona);

  const { data } = await query;

  const lista = ((data ?? []) as unknown as Anunciante[]).sort((a, b) => {
    const zonaA = zonaOrder(a.zona);
    const zonaB = zonaOrder(b.zona);
    if (zonaA !== zonaB) return zonaA - zonaB;
    // Dentro de la misma zona: destacado primero
    if (a.plan !== b.plan) return a.plan === 'destacado' ? -1 : 1;
    return a.nombre_negocio.localeCompare(b.nombre_negocio);
  });

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-10">
          <p className="text-sm font-medium text-(--terra) mb-2 tracking-wide uppercase">Costa del Sol</p>
          <h1 className="font-display text-4xl font-semibold text-(--green) mb-3">Local Partners</h1>
          <p className="text-(--ink)/60 text-lg max-w-2xl">
            Negocios locales de confianza para residentes y visitantes internacionales.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Todas las categorías */}
          <Link
            href={zona ? `/local-partners?zona=${zona}` : '/local-partners'}
            className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: !categoria ? 'var(--green)' : 'var(--bone-2)',
              color: !categoria ? 'var(--bone)' : 'var(--ink)',
              border: `1px solid ${!categoria ? 'var(--green)' : 'var(--line)'}`,
            }}
          >
            Todos
          </Link>
          {CATEGORIAS.map((c) => {
            const params = new URLSearchParams();
            if (c.value !== categoria) params.set('categoria', c.value);
            if (zona) params.set('zona', zona);
            const href = `/local-partners${params.toString() ? `?${params}` : ''}`;
            const active = categoria === c.value;
            return (
              <Link key={c.value} href={href}
                className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: active ? 'var(--terra)' : 'var(--bone-2)',
                  color: active ? 'var(--bone)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--terra)' : 'var(--line)'}`,
                }}>
                {CAT_ICON[c.value]} {c.label}
              </Link>
            );
          })}
        </div>

        {/* Filtro por zona */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href={categoria ? `/local-partners?categoria=${categoria}` : '/local-partners'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: !zona ? 'var(--green)' : 'transparent',
              color: !zona ? 'var(--bone)' : 'var(--ink)/60',
              border: `1px solid ${!zona ? 'var(--green)' : 'var(--line)'}`,
            }}>
            Toda la Costa del Sol
          </Link>
          {ZONAS.map((z) => {
            const params = new URLSearchParams();
            if (categoria) params.set('categoria', categoria);
            if (z !== zona) params.set('zona', z);
            const href = `/local-partners${params.toString() ? `?${params}` : ''}`;
            const active = zona === z;
            return (
              <Link key={z} href={href}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  background: active ? 'var(--green)' : 'transparent',
                  color: active ? 'var(--bone)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--green)' : 'var(--line)'}`,
                }}>
                {z}
              </Link>
            );
          })}
        </div>

        {/* Resultados */}
        {lista.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <p className="text-(--ink)/50 text-lg">
              {categoria || zona ? 'No hay anunciantes con estos filtros.' : 'Próximamente: negocios locales de confianza.'}
            </p>
            {(categoria || zona) && (
              <Link href="/local-partners" className="mt-4 inline-block text-(--green) font-medium hover:opacity-80 transition-opacity">
                Ver todos →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-(--ink)/50 mb-6">
              {lista.length} negocio{lista.length !== 1 ? 's' : ''} encontrado{lista.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lista.map((an) => {
                const desc = (an.descripcion ?? {}) as { es?: string; en?: string };
                const whatsappNum = an.whatsapp?.replace(/\D/g, '');
                return (
                  <div key={an.id}
                    className="rounded-xl border shadow-sm overflow-hidden flex flex-col"
                    style={{ background: 'var(--bone-2)', borderColor: an.plan === 'destacado' ? 'var(--terra)' : 'var(--line)' }}>
                    {/* Plan destacado badge */}
                    {an.plan === 'destacado' && (
                      <div className="px-4 pt-3 pb-0">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,123,74,0.15)', color: 'var(--terra)' }}>
                          ★ Destacado
                        </span>
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col gap-4">
                      {/* Logo + nombre */}
                      <div className="flex items-center gap-3">
                        {an.logo_url ? (
                          <img src={an.logo_url} alt={an.nombre_negocio}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                            style={{ border: '1px solid var(--line)' }} />
                        ) : (
                          <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 text-2xl"
                            style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
                            {CAT_ICON[an.categoria]}
                          </div>
                        )}
                        <div>
                          <h2 className="font-display text-base font-semibold text-(--green) leading-tight">{an.nombre_negocio}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-(--ink)/50">{CATEGORIAS.find(c => c.value === an.categoria)?.label}</span>
                            {an.zona && <><span className="text-(--ink)/30">·</span><span className="text-xs text-(--ink)/50">{an.zona}</span></>}
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      {desc.es && (
                        <p className="text-sm text-(--ink)/70 leading-relaxed line-clamp-3">{desc.es}</p>
                      )}

                      {/* Contacto */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-2">
                        {an.web && (
                          <a href={an.web} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Web
                          </a>
                        )}
                        {whatsappNum && (
                          <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ background: 'rgba(37,211,102,0.12)', color: '#128c7e' }}>
                            WhatsApp
                          </a>
                        )}
                        {an.telefono && (
                          <a href={`tel:${an.telefono}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                            {an.telefono}
                          </a>
                        )}
                        {an.email && (
                          <a href={`mailto:${an.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
