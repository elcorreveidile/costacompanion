'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { actualizarAcompanante } from '@/lib/admin/acompanantes';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Acompanante } from '@/types/supabase';

// ── Datos de formulario ───────────────────────────────────────────────────────

const IDIOMAS = [
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

const ZONAS = [
  'Estepona',
  'Marbella',
  'Fuengirola',
  'Torremolinos',
  'Málaga',
  'Toda la Costa del Sol',
];

const MODALIDADES = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Remoto', value: 'remoto' },
  { label: 'Ambos', value: 'ambos' },
];

// ── Form Component ────────────────────────────────────────────────────────────

function FichaAdminForm({ acompanante }: { acompanante: Acompanante }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const bio = (acompanante.bio ?? {}) as { es?: string; en?: string };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await actualizarAcompanante(acompanante.id, formData);

    setLoading(false);

    if (result.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setStatus({ type: 'success', msg: 'Cambios guardados correctamente.' });
      setTimeout(() => setStatus(null), 4000);
    }
  }

  function inputClass() {
    return 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
  }

  function inputStyle() {
    return { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
  }

  function labelClass() {
    return 'block text-sm font-medium mb-1.5 text-(--ink)';
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className={labelClass()}>Nombre público *</label>
        <input
          name="nombre_publico"
          type="text"
          required
          defaultValue={acompanante.nombre_publico}
          className={inputClass()}
          style={inputStyle()}
        />
      </div>

      {/* Foto URL */}
      <div>
        <label className={labelClass()}>URL de foto</label>
        <input
          name="foto_url"
          type="url"
          defaultValue={acompanante.foto_url ?? ''}
          placeholder="https://..."
          className={inputClass()}
          style={inputStyle()}
        />
      </div>

      {/* Bio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>Bio (Español)</label>
          <textarea
            name="bio_es"
            rows={4}
            defaultValue={bio.es ?? ''}
            className={`${inputClass()} resize-y`}
            style={inputStyle()}
          />
        </div>
        <div>
          <label className={labelClass()}>Bio (English)</label>
          <textarea
            name="bio_en"
            rows={4}
            defaultValue={bio.en ?? ''}
            className={`${inputClass()} resize-y`}
            style={inputStyle()}
          />
        </div>
      </div>

      {/* Idiomas */}
      <div>
        <label className={labelClass()}>Idiomas</label>
        <div className="flex flex-wrap gap-3">
          {IDIOMAS.map((idioma) => (
            <label key={idioma.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="idiomas"
                value={idioma.value}
                defaultChecked={acompanante.idiomas.includes(idioma.value)}
                className="rounded"
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{idioma.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zonas */}
      <div>
        <label className={labelClass()}>Zonas</label>
        <div className="flex flex-wrap gap-3">
          {ZONAS.map((zona) => (
            <label key={zona} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="zonas"
                value={zona}
                defaultChecked={acompanante.zonas.includes(zona)}
                className="rounded"
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{zona}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Modalidades */}
      <div>
        <label className={labelClass()}>Modalidades</label>
        <div className="flex flex-wrap gap-3">
          {MODALIDADES.map((mod) => (
            <label key={mod.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="modalidades"
                value={mod.value}
                defaultChecked={acompanante.modalidades.includes(mod.value as 'presencial' | 'remoto' | 'ambos')}
                className="rounded"
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{mod.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>Email de contacto</label>
          <input
            name="email_contacto"
            type="email"
            defaultValue={acompanante.email_contacto ?? ''}
            className={inputClass()}
            style={inputStyle()}
          />
        </div>
        <div>
          <label className={labelClass()}>WhatsApp</label>
          <input
            name="whatsapp"
            type="text"
            defaultValue={acompanante.whatsapp ?? ''}
            placeholder="+34 600 000 000"
            className={inputClass()}
            style={inputStyle()}
          />
        </div>
      </div>

      {/* Titulación y Experiencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>Titulación</label>
          <input
            name="titulacion"
            type="text"
            defaultValue={acompanante.titulacion ?? ''}
            className={inputClass()}
            style={inputStyle()}
          />
        </div>
        <div>
          <label className={labelClass()}>Años de experiencia</label>
          <input
            name="anios_experiencia"
            type="number"
            min={0}
            defaultValue={acompanante.anios_experiencia ?? ''}
            className={inputClass()}
            style={inputStyle()}
          />
        </div>
      </div>

      {/* Checkboxes booleanos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'interprete_jurado', label: 'Intérprete jurado', val: acompanante.interprete_jurado },
          { name: 'imparte_clases', label: 'Imparte clases', val: acompanante.imparte_clases },
          { name: 'activo', label: 'Activo', val: acompanante.activo },
          { name: 'destacado', label: 'Destacado', val: acompanante.destacado },
        ].map((field) => (
          <label key={field.name} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={field.val}
              className="rounded"
              style={{ accentColor: 'var(--green)' }}
            />
            <span className="text-sm text-(--ink)">{field.label}</span>
          </label>
        ))}
      </div>

      {/* Status message */}
      {status && (
        <div
          className="rounded-lg px-4 py-3 text-sm border"
          style={{
            background: status.type === 'success' ? 'var(--bone-2)' : 'var(--terra-soft)',
            borderColor: status.type === 'success' ? 'var(--green)' : 'var(--terra)',
            color: 'var(--ink)',
          }}
        >
          {status.msg}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/admin/acompanantes')}
          className="px-5 py-3 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
        >
          ← Volver
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function AdminAcompananteEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [acompanante, setAcompanante] = useState<Acompanante | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const admin = createAdminClient();
        const { data, error } = await admin
          .from('acompanantes')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setFetchError('No se encontró el acompañante.');
        } else {
          setAcompanante(data as unknown as Acompanante);
        }
      } catch {
        setFetchError('Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bone) flex items-center justify-center">
        <p className="text-(--ink)/50">Cargando...</p>
      </div>
    );
  }

  if (fetchError || !acompanante) {
    return (
      <div className="min-h-screen bg-(--bone) flex items-center justify-center">
        <p className="text-(--terra)">{fetchError ?? 'Acompañante no encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/admin" className="hover:text-(--ink) transition-colors">Admin</a>
          <span>›</span>
          <a href="/admin/acompanantes" className="hover:text-(--ink) transition-colors">Acompañantes</a>
          <span>›</span>
          <span className="text-(--ink)/80">{acompanante.nombre_publico}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-(--green)">
              {acompanante.nombre_publico}
            </h1>
            <p className="text-(--ink)/50 text-sm mt-1 font-mono">{acompanante.slug}</p>
          </div>
          <a
            href={`/${acompanante.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-(--green) hover:opacity-70 transition-opacity mt-1"
          >
            Ver microsite →
          </a>
        </div>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <FichaAdminForm acompanante={acompanante} />
        </div>
      </div>
    </div>
  );
}
