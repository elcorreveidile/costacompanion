'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarAcompanante } from '@/lib/admin/acompanantes';
import type { Acompanante } from '@/types/supabase';

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

export function FichaAdminForm({ acompanante }: { acompanante: Acompanante }) {
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

  const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none';
  const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
  const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className={labelClass}>Nombre público *</label>
        <input
          name="nombre_publico"
          type="text"
          required
          defaultValue={acompanante.nombre_publico}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Foto URL */}
      <div>
        <label className={labelClass}>URL de foto</label>
        <input
          name="foto_url"
          type="url"
          defaultValue={acompanante.foto_url ?? ''}
          placeholder="https://..."
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Bio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Bio (Español)</label>
          <textarea
            name="bio_es"
            rows={4}
            defaultValue={bio.es ?? ''}
            className={`${inputClass} resize-y`}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>Bio (English)</label>
          <textarea
            name="bio_en"
            rows={4}
            defaultValue={bio.en ?? ''}
            className={`${inputClass} resize-y`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Idiomas */}
      <div>
        <label className={labelClass}>Idiomas</label>
        <div className="flex flex-wrap gap-3">
          {IDIOMAS.map((idioma) => (
            <label key={idioma.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="idiomas"
                value={idioma.value}
                defaultChecked={acompanante.idiomas.includes(idioma.value)}
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{idioma.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zonas */}
      <div>
        <label className={labelClass}>Zonas</label>
        <div className="flex flex-wrap gap-3">
          {ZONAS.map((zona) => (
            <label key={zona} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="zonas"
                value={zona}
                defaultChecked={acompanante.zonas.includes(zona)}
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{zona}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Modalidades */}
      <div>
        <label className={labelClass}>Modalidades</label>
        <div className="flex flex-wrap gap-3">
          {MODALIDADES.map((mod) => (
            <label key={mod.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="modalidades"
                value={mod.value}
                defaultChecked={acompanante.modalidades.includes(mod.value as 'presencial' | 'remoto' | 'ambos')}
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
          <label className={labelClass}>Email de contacto</label>
          <input
            name="email_contacto"
            type="email"
            defaultValue={acompanante.email_contacto ?? ''}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input
            name="whatsapp"
            type="text"
            defaultValue={acompanante.whatsapp ?? ''}
            placeholder="+34 600 000 000"
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Titulación y Experiencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Titulación</label>
          <input
            name="titulacion"
            type="text"
            defaultValue={acompanante.titulacion ?? ''}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>Años de experiencia</label>
          <input
            name="anios_experiencia"
            type="number"
            min={0}
            defaultValue={acompanante.anios_experiencia ?? ''}
            className={inputClass}
            style={inputStyle}
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
              style={{ accentColor: 'var(--green)' }}
            />
            <span className="text-sm text-(--ink)">{field.label}</span>
          </label>
        ))}
      </div>

      {status && (
        <div
          className="rounded-lg px-4 py-3 text-sm border"
          style={{
            background: status.type === 'success' ? 'var(--bone-2)' : 'rgba(201,123,74,0.1)',
            borderColor: status.type === 'success' ? 'var(--green)' : 'var(--terra)',
            color: 'var(--ink)',
          }}
        >
          {status.msg}
        </div>
      )}

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
