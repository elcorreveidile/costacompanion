import Link from 'next/link';
import Image from 'next/image';
import type { Acompanante } from '@/types/supabase';
import {
  listServiceCategories,
  listAcompanantesActivos,
  filtrarAcompananteIdsPorCategoria,
} from '@/lib/db/queries/public';
import { LocalPartnersDestacados } from '@/components/LocalPartnersDestacados';
import { getI18n } from '@/lib/i18n/server';
import { localePath, languageName, type Locale } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';
import type { Dictionary } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Nuestros acompañantes | Costa Companion',
  description: 'Encuentra tu acompañante lingüístico ideal en la Costa del Sol.',
};

interface SearchParams {
  idioma?: string;
  categoria?: string;
  zona?: string;
  modalidad?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

const IDIOMA_CODES = ['es', 'en', 'fr', 'de', 'nl', 'ru', 'zh', 'ar', 'pt', 'it'];

const ZONAS_OPTIONS = [
  'Estepona',
  'Manilva',
  'Casares',
  'San Pedro de Alcántara',
  'Puerto Banús',
  'Benahavís',
  'Marbella',
  'Fuengirola',
  'Torremolinos',
  'Málaga',
  'Toda la Costa del Sol',
];

function Estrellas({ valor, total }: { valor: number | null; total: number }) {
  const rounded = Math.round((valor ?? 0) * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill={star <= rounded ? 'var(--terra)' : 'none'}
          stroke="var(--terra)"
          strokeWidth={1.5}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {total > 0 && (
        <span className="text-xs text-(--ink)/50 ml-1">({total})</span>
      )}
    </div>
  );
}

function AcompananteCard({
  acompanante,
  locale,
  dict,
}: {
  acompanante: Acompanante;
  locale: Locale;
  dict: Dictionary;
}) {
  const bioFull = pickLang(acompanante.bio, locale);
  const bioTruncated = bioFull.length > 100 ? bioFull.slice(0, 100) + '...' : bioFull;

  return (
    <Link
      href={localePath(locale, `/${acompanante.slug}`)}
      className="group flex flex-col rounded-xl border shadow-sm overflow-hidden transition-opacity hover:opacity-90"
      style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
    >
      {/* Foto */}
      <div
        className="relative w-full aspect-[4/3] overflow-hidden"
        style={{ background: 'var(--bone)' }}
      >
        {acompanante.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={acompanante.foto_url}
            alt={acompanante.nombre_publico}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* Badges sobre la foto */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {acompanante.destacado && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--terra)', color: 'var(--bone)' }}
            >
              {dict.common.badges.destacado}
            </span>
          )}
          {acompanante.interprete_jurado && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              {dict.common.badges.interpreteJurado}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5">
        <h3 className="font-display text-lg font-medium text-(--green) mb-1">
          {acompanante.nombre_publico}
        </h3>

        <Estrellas valor={acompanante.valoracion_media} total={acompanante.num_resenas} />

        {bioTruncated && (
          <p className="text-sm text-(--ink)/70 mt-2 leading-relaxed">{bioTruncated}</p>
        )}

        {/* Idiomas */}
        {acompanante.idiomas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {acompanante.idiomas.slice(0, 4).map((id) => (
              <span
                key={id}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1px solid var(--line)' }}
              >
                {languageName(id, locale)}
              </span>
            ))}
            {acompanante.idiomas.length > 4 && (
              <span className="text-xs text-(--ink)/40">+{acompanante.idiomas.length - 4}</span>
            )}
          </div>
        )}

        {/* Zonas */}
        {acompanante.zonas.length > 0 && (
          <p className="text-xs text-(--ink)/50 mt-2 truncate">
            📍 {acompanante.zonas.slice(0, 2).join(', ')}
            {acompanante.zonas.length > 2 ? ` +${acompanante.zonas.length - 2}` : ''}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function DirectorioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { locale, dict } = await getI18n();
  const t = dict.directorio;
  const lp = (href: string) => localePath(locale, href);
  const MODALIDADES_OPTIONS = [
    { label: dict.common.modalidades.presencial, value: 'presencial' },
    { label: dict.common.modalidades.remoto, value: 'remoto' },
    { label: dict.common.modalidades.ambos, value: 'ambos' },
  ];

  // Cargar categorías para el filtro
  const categorias = await listServiceCategories();

  // Acompañantes activos (con filtros opcionales de idioma/zona/modalidad)
  let acompanantes = await listAcompanantesActivos({
    idioma: params.idioma,
    zona: params.zona,
    modalidad: params.modalidad,
  });

  // Filtro por categoría (requiere join con servicios)
  if (params.categoria && acompanantes.length > 0) {
    const idsConCategoria = await filtrarAcompananteIdsPorCategoria(
      acompanantes.map((a) => a.id),
      params.categoria
    );
    acompanantes = acompanantes.filter((a) => idsConCategoria.has(a.id));
  }

  const hayFiltros = params.idioma || params.zona || params.modalidad || params.categoria;

  return (
    <div className="min-h-screen bg-(--bone)">
      {/* Hero */}
      <section
        className="relative py-16 px-4 text-center overflow-hidden"
        style={{ background: 'var(--green)' }}
      >
        <Image
          src="/images/playa-dia.jpg"
          alt="Playa de la Costa del Sol"
          fill
          className="object-cover"
          style={{ opacity: 0.28 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(28,50,38,0.45) 0%, rgba(28,50,38,0.78) 100%)' }}
        />
        <div className="relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4" style={{ color: 'var(--bone)' }}>
            {t.hero.h1}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(247,242,233,0.8)' }}>
            {t.hero.subtitle}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filtros */}
        <form
          method="GET"
          action={lp('/directorio')}
          className="rounded-xl border p-5 mb-8 shadow-sm"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Idioma */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">{t.filtros.idioma}</label>
              <select
                name="idioma"
                defaultValue={params.idioma ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{t.filtros.todos}</option>
                {IDIOMA_CODES.map((code) => (
                  <option key={code} value={code}>{languageName(code, locale)}</option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">{t.filtros.categoria}</label>
              <select
                name="categoria"
                defaultValue={params.categoria ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{t.filtros.todas}</option>
                {categorias.map((cat) => {
                  const nombre = pickLang(cat.nombre as Record<string, unknown>, locale) || cat.key;
                  return <option key={cat.id} value={cat.id}>{nombre}</option>;
                })}
              </select>
            </div>

            {/* Zona */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">{t.filtros.zona}</label>
              <select
                name="zona"
                defaultValue={params.zona ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{t.filtros.todas}</option>
                {ZONAS_OPTIONS.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">{t.filtros.modalidad}</label>
              <select
                name="modalidad"
                defaultValue={params.modalidad ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{t.filtros.todas}</option>
                {MODALIDADES_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              {t.filtros.filtrar}
            </button>
            {hayFiltros && (
              <Link
                href={lp('/directorio')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {t.filtros.limpiar}
              </Link>
            )}
          </div>
        </form>

        {/* Resultados */}
        {acompanantes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-(--ink)/40 mb-4">
              {t.resultados.ningunoTitulo}
            </p>
            <p className="text-(--ink)/30 mb-6">
              {t.resultados.ningunoSub}
            </p>
            {hayFiltros && (
              <Link
                href={lp('/directorio')}
                className="inline-flex px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                {t.resultados.verTodos}
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-(--ink)/50 mb-6">
              {acompanantes.length} {acompanantes.length !== 1 ? t.resultados.varios : t.resultados.uno}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {acompanantes.map((ac) => (
                <AcompananteCard key={ac.id} acompanante={ac} locale={locale} dict={dict} />
              ))}
            </div>
          </>
        )}

        <LocalPartnersDestacados />
      </div>
    </div>
  );
}
