import Link from 'next/link';
import Image from 'next/image';
import type { CategoriaAnunciante } from '@/types/supabase';
import { listAnunciantesActivos } from '@/lib/db/queries/public';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Local Partners | Costa Companion',
  description: 'Negocios locales recomendados en la Costa del Sol — inmobiliarias, salud, legal, restauración y más.',
};

interface PageProps {
  searchParams: Promise<{ categoria?: string; zona?: string }>;
}

const CATEGORIA_VALUES: CategoriaAnunciante[] = [
  'inmobiliaria', 'salud', 'legal', 'restauracion', 'comercio', 'otros',
];

const ZONAS = [
  'Estepona', 'Manilva', 'Casares', 'San Pedro de Alcántara', 'Puerto Banús', 'Benahavís',
  'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga', 'Otra Costa del Sol',
];

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
  const { locale, dict } = await getI18n();
  const t = dict.localPartners;
  const lp = (href: string) => localePath(locale, href);
  const catLabel = (c: string) =>
    (dict.common.categoriasAnunciante as Record<string, string>)[c] ?? c;
  const CATEGORIAS = CATEGORIA_VALUES.map((value) => ({ value, label: catLabel(value) }));

  const lista = (await listAnunciantesActivos({ categoria, zona })).sort((a, b) => {
    const zonaA = zonaOrder(a.zona);
    const zonaB = zonaOrder(b.zona);
    if (zonaA !== zonaB) return zonaA - zonaB;
    // Dentro de la misma zona: destacado primero
    if (a.plan !== b.plan) return a.plan === 'destacado' ? -1 : 1;
    return a.nombre_negocio.localeCompare(b.nombre_negocio);
  });

  return (
    <div className="min-h-screen bg-(--bone)">
      {/* Hero */}
      <section className="relative py-16 px-4 text-center overflow-hidden" style={{ background: 'var(--green)' }}>
        <Image
          src="/images/estepona-cartel.jpg"
          alt="Cartel de Estepona en el centro"
          fill
          className="object-cover"
          style={{ opacity: 0.3 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(28,50,38,0.45) 0%, rgba(28,50,38,0.8) 100%)' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto">
          <p className="text-sm font-medium mb-2 tracking-wide uppercase" style={{ color: 'rgba(247,244,239,0.6)' }}>Costa del Sol</p>
          <h1 className="font-display text-4xl font-semibold mb-3" style={{ color: 'var(--bone)' }}>Local Partners</h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(247,244,239,0.82)' }}>
            {t.subtitle}
          </p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Todas las categorías */}
          <Link
            href={lp(zona ? `/local-partners?zona=${zona}` : '/local-partners')}
            className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: !categoria ? 'var(--green)' : 'var(--bone-2)',
              color: !categoria ? 'var(--bone)' : 'var(--ink)',
              border: `1px solid ${!categoria ? 'var(--green)' : 'var(--line)'}`,
            }}
          >
            {t.todos}
          </Link>
          {CATEGORIAS.map((c) => {
            const params = new URLSearchParams();
            if (c.value !== categoria) params.set('categoria', c.value);
            if (zona) params.set('zona', zona);
            const href = lp(`/local-partners${params.toString() ? `?${params}` : ''}`);
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
            href={lp(categoria ? `/local-partners?categoria=${categoria}` : '/local-partners')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: !zona ? 'var(--green)' : 'transparent',
              color: !zona ? 'var(--bone)' : 'var(--ink)/60',
              border: `1px solid ${!zona ? 'var(--green)' : 'var(--line)'}`,
            }}>
            {t.todaCostaDelSol}
          </Link>
          {ZONAS.map((z) => {
            const params = new URLSearchParams();
            if (categoria) params.set('categoria', categoria);
            if (z !== zona) params.set('zona', z);
            const href = lp(`/local-partners${params.toString() ? `?${params}` : ''}`);
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
              {categoria || zona ? t.ningunoFiltros : t.ningunoVacio}
            </p>
            {(categoria || zona) && (
              <Link href={lp('/local-partners')} className="mt-4 inline-block text-(--green) font-medium hover:opacity-80 transition-opacity">
                {t.verTodos}
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-(--ink)/50 mb-6">
              {lista.length} {lista.length !== 1 ? t.negociosVarios : t.negociosUno}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lista.map((an) => {
                const descText = pickLang(an.descripcion as Record<string, unknown> | null, locale);
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
                          {t.destacadoBadge}
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
                          <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden"
                            style={{ border: '1px solid var(--line)' }}>
                            <Image
                              src="/images/local-partner-placeholder.png"
                              alt="Local Partner"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h2 className="font-display text-base font-semibold text-(--green) leading-tight">{an.nombre_negocio}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-(--ink)/50">{catLabel(an.categoria)}</span>
                            {an.zona && <><span className="text-(--ink)/30">·</span><span className="text-xs text-(--ink)/50">{an.zona}</span></>}
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      {descText && (
                        <p className="text-sm text-(--ink)/70 leading-relaxed line-clamp-3">{descText}</p>
                      )}

                      {/* Dirección + mapa */}
                      {an.direccion && (() => {
                        const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(an.direccion!)}`;
                        return (
                          <a href={mapsHref} target="_blank" rel="noopener noreferrer"
                            className="flex items-start gap-1.5 group transition-opacity hover:opacity-70">
                            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                              stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--terra)' }}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.6 }}>
                              {an.direccion}
                            </span>
                          </a>
                        );
                      })()}

                      {/* Contacto */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-2">
                        <Link href={lp(`/local-partners/${an.slug}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                          {t.verFicha}
                        </Link>
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
                            {t.email}
                          </a>
                        )}
                        {an.direccion && (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(an.direccion)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ background: 'rgba(66,133,244,0.1)', color: '#2563eb' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t.verEnMapa}
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
