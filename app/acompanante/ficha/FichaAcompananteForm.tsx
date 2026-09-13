'use client';

import { useState } from 'react';
import { actualizarFicha } from '@/lib/acompanante/actions';
import { FotoUpload } from './FotoUpload';
import type { Acompanante } from '@/types/supabase';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { languageName, locales, type Locale } from '@/lib/i18n/config';

type FichaDict = Dictionary['panelAcompanante']['ficha'];
type Modalidades = Dictionary['common']['modalidades'];

const IDIOMA_CODES = ['es', 'en', 'fr', 'de', 'nl', 'ru', 'zh', 'ar', 'pt', 'it'];

const ZONAS = [
  'Estepona',
  'Sotogrande',
  'Duquesa',
  'Manilva',
  'Casares',
  'Benahavís',
  'Marbella',
  'Fuengirola',
  'Torremolinos',
  'Málaga',
  'Toda la Costa del Sol',
];

const MODALIDAD_VALUES: ('presencial' | 'remoto' | 'ambos')[] = ['presencial', 'remoto', 'ambos'];

function inputClass() {
  return 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
}

const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };

function labelClass() {
  return 'block text-sm font-medium mb-1.5 text-(--ink)';
}

interface Props {
  acompanante: Acompanante;
  t: FichaDict;
  modalidades: Modalidades;
  locale: Locale;
}

export function FichaAcompananteForm({ acompanante, t, modalidades, locale }: Props) {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>(acompanante.foto_url ?? '');

  const bio = (acompanante.bio ?? {}) as Record<string, string>;

  const zonasNombres = t.zonasNombres as Record<string, string>;

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
      setStatus({ type: 'success', msg: t.guardado });
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className={labelClass()}>{t.nombrePublico}</label>
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
        <label className={labelClass()}>{t.fotoPerfil}</label>
        <FotoUpload
          initialUrl={acompanante.foto_url}
          onUrlChange={setFotoUrl}
          t={t.foto}
        />
        {/* Hidden input so the main form always sends the current foto_url */}
        <input type="hidden" name="foto_url" value={fotoUrl} readOnly />
      </div>

      {/* Presentación / Bio en los 7 idiomas de la web */}
      <div>
        <label className={labelClass()}>{t.presentacion}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locales.map((code) => (
            <div key={code}>
              <label className="block text-xs font-medium mb-1 text-(--ink)/70">
                {languageName(code, locale)}
              </label>
              <textarea
                name={`bio_${code}`}
                rows={4}
                defaultValue={bio[code] ?? ''}
                placeholder={code === 'es' ? t.presentacionEsPlaceholder : undefined}
                className={`${inputClass()} resize-y`}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Idiomas */}
      <div>
        <label className={labelClass()}>{t.idiomas}</label>
        <div className="flex flex-wrap gap-3">
          {IDIOMA_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="idiomas"
                value={code}
                defaultChecked={acompanante.idiomas.includes(code)}
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{languageName(code, locale)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zonas */}
      <div>
        <label className={labelClass()}>{t.zonas}</label>
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
              <span className="text-sm text-(--ink)">{zonasNombres[zona] ?? zona}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Modalidades */}
      <div>
        <label className={labelClass()}>{t.modalidades}</label>
        <div className="flex flex-wrap gap-3">
          {MODALIDAD_VALUES.map((mod) => (
            <label key={mod} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="modalidades"
                value={mod}
                defaultChecked={acompanante.modalidades.includes(mod)}
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm text-(--ink)">{modalidades[mod]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>{t.emailContacto}</label>
          <input
            name="email_contacto"
            type="email"
            defaultValue={acompanante.email_contacto ?? ''}
            className={inputClass()}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass()}>{t.whatsapp}</label>
          <input
            name="whatsapp"
            type="text"
            defaultValue={acompanante.whatsapp ?? ''}
            placeholder={t.whatsappPlaceholder}
            className={inputClass()}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Titulación y Experiencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>{t.titulacion}</label>
          <input
            name="titulacion"
            type="text"
            defaultValue={acompanante.titulacion ?? ''}
            className={inputClass()}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass()}>{t.aniosExperiencia}</label>
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
          <span className="text-sm text-(--ink)">{t.interpreteJurado}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="imparte_clases"
            defaultChecked={acompanante.imparte_clases}
            style={{ accentColor: 'var(--green)' }}
          />
          <span className="text-sm text-(--ink)">{t.imparteClases}</span>
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
        {loading ? t.guardando : t.guardar}
      </button>
    </form>
  );
}
