'use client';

import { useState } from 'react';
import { actualizarFicha } from '@/lib/acompanante/actions';
import { FotoUpload } from './FotoUpload';
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

function inputClass() {
  return 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
}

const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };

function labelClass() {
  return 'block text-sm font-medium mb-1.5 text-(--ink)';
}

export function FichaAcompananteForm({ acompanante }: { acompanante: Acompanante }) {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>(acompanante.foto_url ?? '');

  const bio = (acompanante.bio ?? {}) as { es?: string; en?: string };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await actualizarFicha(formData);

    setLoading(false);

    if (result.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setStatus({ type: 'success', msg: 'Ficha actualizada correctamente.' });
      setTimeout(() => setStatus(null), 4000);
    }
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
          style={inputStyle}
        />
      </div>

      {/* Foto */}
      <div>
        <label className={labelClass()}>Foto de perfil</label>
        <FotoUpload
          initialUrl={acompanante.foto_url}
          onUrlChange={setFotoUrl}
        />
        {/* Hidden input so the main form always sends the current foto_url */}
        <input type="hidden" name="foto_url" value={fotoUrl} readOnly />
      </div>

      {/* Bio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>Presentación (Español)</label>
          <textarea
            name="bio_es"
            rows={5}
            defaultValue={bio.es ?? ''}
            placeholder="Cuéntanos sobre ti..."
            className={`${inputClass()} resize-y`}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass()}>About me (English)</label>
          <textarea
            name="bio_en"
            rows={5}
            defaultValue={bio.en ?? ''}
            placeholder="Tell us about yourself..."
            className={`${inputClass()} resize-y`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Idiomas */}
      <div>
        <label className={labelClass()}>Idiomas que dominas</label>
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
        <label className={labelClass()}>Zonas donde trabajas</label>
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
        <label className={labelClass()}>Modalidades</label>
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
          <label className={labelClass()}>Email de contacto</label>
          <input
            name="email_contacto"
            type="email"
            defaultValue={acompanante.email_contacto ?? ''}
            className={inputClass()}
            style={inputStyle}
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
            style={inputStyle}
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
            style={inputStyle}
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
            style={inputStyle}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="interprete_jurado"
            defaultChecked={acompanante.interprete_jurado}
            style={{ accentColor: 'var(--green)' }}
          />
          <span className="text-sm text-(--ink)">Intérprete jurado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="imparte_clases"
            defaultChecked={acompanante.imparte_clases}
            style={{ accentColor: 'var(--green)' }}
          />
          <span className="text-sm text-(--ink)">Imparto clases</span>
        </label>
      </div>

      {/* Status */}
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
        style={{ background: 'var(--green)', color: 'var(--bone)' }}
      >
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
