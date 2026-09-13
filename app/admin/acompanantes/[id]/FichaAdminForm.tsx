'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarAcompanante, resetPinAcompanante, subirFotoAcompananteAdmin } from '@/lib/admin/acompanantes';
import type { Acompanante } from '@/types/supabase';
import { FotoUpload } from '@/app/acompanante/ficha/FotoUpload';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { languageName, localePath, type Locale } from '@/lib/i18n/config';

type FormDict = Dictionary['panelAdmin']['acompanantes']['form'];
type SharedDict = Dictionary['panelAdmin']['shared'];
type Modalidades = Dictionary['common']['modalidades'];
type FotoDict = Dictionary['panelAcompanante']['ficha']['foto'];

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

interface Props {
  acompanante: Acompanante;
  t: FormDict;
  shared: SharedDict;
  modalidades: Modalidades;
  fotoT: FotoDict;
  locale: Locale;
}

export function FichaAdminForm({ acompanante, t, shared, modalidades, fotoT, locale }: Props) {
  const router = useRouter();
  const zonasNombres = t.zonasNombres as Record<string, string>;
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [nuevoPin, setNuevoPin] = useState<{ numeroUsuario?: string; pin?: string } | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string>(acompanante.foto_url ?? '');

  const bio = (acompanante.bio ?? {}) as { es?: string; en?: string };

  async function handleResetPin() {
    if (!confirm(t.confirmResetPin)) return;
    setNuevoPin(null);
    setPinLoading(true);
    const result = await resetPinAcompanante(acompanante.profile_id);
    setPinLoading(false);
    if (result.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setNuevoPin({ numeroUsuario: result.numeroUsuario, pin: result.pin });
    }
  }

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
      setStatus({ type: 'success', msg: shared.guardadoOk });
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
        <label className={labelClass}>{t.nombrePublico}</label>
        <input
          name="nombre_publico"
          type="text"
          required
          defaultValue={acompanante.nombre_publico}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Foto de perfil */}
      <div>
        <label className={labelClass}>{t.fotoPerfil}</label>
        <FotoUpload
          initialUrl={acompanante.foto_url}
          onUrlChange={setFotoUrl}
          uploadAction={subirFotoAcompananteAdmin}
          extraFields={{ acompanante_id: acompanante.id }}
          t={fotoT}
        />
        {/* El formulario envía siempre la URL actual de la foto */}
        <input type="hidden" name="foto_url" value={fotoUrl} readOnly />
      </div>

      {/* Bio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.bioEs}</label>
          <textarea
            name="bio_es"
            rows={4}
            defaultValue={bio.es ?? ''}
            className={`${inputClass} resize-y`}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>{t.bioEn}</label>
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
        <label className={labelClass}>{t.idiomas}</label>
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
        <label className={labelClass}>{t.zonas}</label>
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
        <label className={labelClass}>{t.modalidades}</label>
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
          <label className={labelClass}>{t.emailContacto}</label>
          <input
            name="email_contacto"
            type="email"
            defaultValue={acompanante.email_contacto ?? ''}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>{t.whatsapp}</label>
          <input
            name="whatsapp"
            type="text"
            defaultValue={acompanante.whatsapp ?? ''}
            placeholder={t.whatsappPlaceholder}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Titulación y Experiencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.titulacion}</label>
          <input
            name="titulacion"
            type="text"
            defaultValue={acompanante.titulacion ?? ''}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>{t.aniosExperiencia}</label>
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
          { name: 'interprete_jurado', label: t.interpreteJurado, val: acompanante.interprete_jurado },
          { name: 'imparte_clases', label: t.imparteClases, val: acompanante.imparte_clases },
          { name: 'activo', label: t.activo, val: acompanante.activo },
          { name: 'destacado', label: t.destacado, val: acompanante.destacado },
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

      {/* Acceso por PIN */}
      <div className="rounded-lg p-4" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-(--ink)">{t.accesoPin}</p>
            <p className="text-xs text-(--ink)/50 mt-0.5">
              {t.accesoPinDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetPin}
            disabled={pinLoading}
            className="text-sm px-4 py-2 rounded-lg border transition-opacity hover:opacity-70 disabled:opacity-60"
            style={{ borderColor: 'var(--terra)', color: 'var(--terra)', background: 'transparent' }}
          >
            {pinLoading ? t.reiniciando : t.reiniciarPin}
          </button>
        </div>
        {nuevoPin && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-(--ink)/50 mb-1">{shared.numeroUsuario}</p>
              <p className="text-xl font-mono font-semibold tracking-widest text-(--ink)">{nuevoPin.numeroUsuario}</p>
            </div>
            <div>
              <p className="text-xs text-(--ink)/50 mb-1">{t.pinNuevo}</p>
              <p className="text-xl font-mono font-semibold tracking-widest text-(--ink)">{nuevoPin.pin}</p>
            </div>
            <p className="text-xs text-(--terra) sm:col-span-2">
              {t.apuntaPin}
            </p>
          </div>
        )}
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
          onClick={() => router.push(localePath(locale, '/admin/acompanantes'))}
          className="px-5 py-3 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
        >
          {shared.volver}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          {loading ? shared.guardando : shared.guardar}
        </button>
      </div>
    </form>
  );
}
