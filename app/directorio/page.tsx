import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Acompanante, ServiceCategory } from '@/types/supabase';
import { LocalPartnersDestacados } from '@/components/LocalPartnersDestacados';

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

const IDIOMAS_OPTIONS = [
  { label: 'Español', value: 'es' },
  { label: 'Inglés', value: 'en' },
  { label: 'Francés', value: 'fr' },
  { label: 'Alemán', value: 'de' },
  { label: 'Neerlandés', value: 'nl' },
  { label: 'Ruso', value: 'ru' },
  { label: 'Chino', value: 'zh' },
  { label: 'Árabe', value: 'ar' },
  { label: 'Portugués', value: 'pt' },
  { label: 'Italiano', value: 'it' },
];

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

const MODALIDADES_OPTIONS = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Remoto', value: 'remoto' },
  { label: 'Ambos', value: 'ambos' },
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

function AcompananteCard({ acompanante }: { acompanante: Acompanante }) {
  const bio = (acompanante.bio ?? {}) as { es?: string; en?: string };
  const bioEs = bio.es ?? '';
  const bioTruncated = bioEs.length > 100 ? bioEs.slice(0, 100) + '...' : bioEs;

  return (
    <Link
      href={`/${acompanante.slug}`}
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
              Destacado
            </span>
          )}
          {acompanante.interprete_jurado && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              Intérprete jurado
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
                {IDIOMAS_OPTIONS.find((o) => o.value === id)?.label ?? id}
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
  const supabase = await createClient();

  // Cargar categorías para el filtro
  const { data: categoriasData } = await supabase
    .from('service_categories')
    .select('*')
    .order('grupo');

  const categorias = (categoriasData ?? []) as unknown as ServiceCategory[];

  // Query principal
  let query = supabase
    .from('acompanantes')
    .select('*')
    .eq('activo', true)
    .order('destacado', { ascending: false })
    .order('valoracion_media', { ascending: false, nullsFirst: false });

  // Filtros opcionales
  if (params.idioma) {
    query = query.contains('idiomas', [params.idioma]);
  }
  if (params.zona) {
    query = query.contains('zonas', [params.zona]);
  }
  if (params.modalidad) {
    query = query.contains('modalidades', [params.modalidad]);
  }

  const { data: acompanantesData } = await query;
  let acompanantes = (acompanantesData ?? []) as unknown as Acompanante[];

  // Filtro por categoría (requiere join; filtramos en memoria si viene el param)
  if (params.categoria && acompanantes.length > 0) {
    const ids = acompanantes.map((a) => a.id);
    const { data: serviciosData } = await supabase
      .from('servicios')
      .select('acompanante_id')
      .eq('categoria', params.categoria)
      .eq('activo', true)
      .in('acompanante_id', ids) as { data: { acompanante_id: string }[] | null; error: null };

    const idsConCategoria = new Set((serviciosData ?? []).map((s) => s.acompanante_id));
    acompanantes = acompanantes.filter((a) => idsConCategoria.has(a.id));
  }

  const hayFiltros = params.idioma || params.zona || params.modalidad || params.categoria;

  return (
    <div className="min-h-screen bg-(--bone)">
      {/* Hero */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: 'var(--green)' }}
      >
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4" style={{ color: 'var(--bone)' }}>
          Nuestros acompañantes
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(247,242,233,0.8)' }}>
          Profesionales lingüísticos a tu lado en la Costa del Sol. Trámites, salud, hogar y más.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filtros */}
        <form
          method="GET"
          action="/directorio"
          className="rounded-xl border p-5 mb-8 shadow-sm"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Idioma */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">Idioma</label>
              <select
                name="idioma"
                defaultValue={params.idioma ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">Todos</option>
                {IDIOMAS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">Categoría</label>
              <select
                name="categoria"
                defaultValue={params.categoria ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">Todas</option>
                {categorias.map((cat) => {
                  const nombre = (cat.nombre as { es?: string }).es ?? cat.key;
                  return <option key={cat.id} value={cat.id}>{nombre}</option>;
                })}
              </select>
            </div>

            {/* Zona */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">Zona</label>
              <select
                name="zona"
                defaultValue={params.zona ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">Todas</option>
                {ZONAS_OPTIONS.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-xs font-medium mb-1 text-(--ink)/60">Modalidad</label>
              <select
                name="modalidad"
                defaultValue={params.modalidad ?? ''}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">Todas</option>
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
              Filtrar
            </button>
            {hayFiltros && (
              <Link
                href="/directorio"
                className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                Limpiar filtros
              </Link>
            )}
          </div>
        </form>

        {/* Resultados */}
        {acompanantes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-(--ink)/40 mb-4">
              Todavía no encontramos un acompañante con esos criterios.
            </p>
            <p className="text-(--ink)/30 mb-6">
              Prueba a ampliar la búsqueda, o escríbenos y te ayudamos a encontrar a la persona adecuada.
            </p>
            {hayFiltros && (
              <Link
                href="/directorio"
                className="inline-flex px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                Ver todos los acompañantes
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-(--ink)/50 mb-6">
              {acompanantes.length} acompañante{acompanantes.length !== 1 ? 's' : ''} encontrado{acompanantes.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {acompanantes.map((ac) => (
                <AcompananteCard key={ac.id} acompanante={ac} />
              ))}
            </div>
          </>
        )}

        <LocalPartnersDestacados />
      </div>
    </div>
  );
}
