'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarAnunciante } from '@/lib/admin/anunciantes';
import type { Anunciante } from '@/types/supabase';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { localePath, locales, localeNames, type Locale } from '@/lib/i18n/config';

type FormDict = Dictionary['panelAdmin']['anunciantes']['form'];
type SharedDict = Dictionary['panelAdmin']['shared'];
type PlanOpciones = Dictionary['panelAdmin']['anunciantes']['planOpciones'];
type Categorias = Dictionary['common']['categoriasAnunciante'];

const CATEGORIA_VALUES: (keyof Categorias)[] = [
  'inmobiliaria', 'salud', 'legal', 'restauracion', 'comercio', 'otros',
];

const ZONAS = [
  'Estepona', 'Sotogrande', 'Duquesa', 'Manilva', 'Casares', 'San Pedro de Alcántara', 'Puerto Banús', 'Benahavís',
  'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga', 'Otra Costa del Sol',
];

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

interface Props {
  anunciante: Anunciante;
  t: FormDict;
  shared: SharedDict;
  planOpciones: PlanOpciones;
  categorias: Categorias;
  locale: Locale;
}

export function FichaAdminFormAnunciante({ anunciante, t, shared, planOpciones, categorias, locale }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const desc = (anunciante.descripcion ?? {}) as Record<string, string>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await actualizarAnunciante(anunciante.id, formData);
    setLoading(false);
    if (result.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setStatus({ type: 'success', msg: shared.guardado });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre del negocio */}
      <div>
        <label className={labelClass}>{t.nombreNegocio}</label>
        <input name="nombre_negocio" type="text" defaultValue={anunciante.nombre_negocio}
          className={inputClass} style={inputStyle} required />
      </div>

      {/* Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.categoria}</label>
          <select name="categoria" defaultValue={anunciante.categoria} className={inputClass} style={inputStyle}>
            {CATEGORIA_VALUES.map((c) => <option key={c} value={c}>{categorias[c]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t.plan}</label>
          <select name="plan" defaultValue={anunciante.plan} className={inputClass} style={inputStyle}>
            <option value="basico">{planOpciones.basico}</option>
            <option value="destacado">{planOpciones.destacado}</option>
          </select>
        </div>
      </div>

      {/* Zona */}
      <div>
        <label className={labelClass}>{t.zonaPrincipal}</label>
        <select name="zona" defaultValue={anunciante.zona ?? ''} className={inputClass} style={inputStyle}>
          <option value="">{t.sinZona}</option>
          {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelClass}>{t.logoUrl}</label>
        <input name="logo_url" type="url" defaultValue={anunciante.logo_url ?? ''}
          placeholder={t.logoUrlPlaceholder} className={inputClass} style={inputStyle} />
      </div>

      {/* Descripción por idioma */}
      <div className="space-y-3">
        <label className={labelClass}>{t.descripcion}</label>
        {locales.map((code) => (
          <div key={code}>
            <span className="block text-xs mb-1 text-(--ink)/50">{localeNames[code]}</span>
            <textarea
              name={`descripcion_${code}`}
              rows={code === 'es' || code === 'en' ? 3 : 2}
              defaultValue={desc[code] ?? ''}
              className={inputClass}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        ))}
      </div>

      {/* Web */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.web}</label>
          <input name="web" type="url" defaultValue={anunciante.web ?? ''}
            placeholder={t.webPlaceholder} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>{t.email}</label>
          <input name="email" type="email" defaultValue={anunciante.email ?? ''}
            placeholder={t.emailPlaceholder} className={inputClass} style={inputStyle} />
        </div>
      </div>

      {/* Teléfono / WhatsApp */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.telefono}</label>
          <input name="telefono" type="tel" defaultValue={anunciante.telefono ?? ''}
            placeholder={t.telefonoPlaceholder} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>{t.whatsapp}</label>
          <input name="whatsapp" type="tel" defaultValue={anunciante.whatsapp ?? ''}
            placeholder={t.whatsappPlaceholder} className={inputClass} style={inputStyle} />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className={labelClass}>{t.direccion}</label>
        <input name="direccion" type="text" defaultValue={anunciante.direccion ?? ''}
          placeholder={t.direccionPlaceholder}
          className={inputClass} style={inputStyle} />
      </div>

      {/* Activo */}
      <div className="flex items-center gap-3 pt-2">
        <input type="checkbox" name="activo" id="activo" defaultChecked={anunciante.activo}
          className="w-4 h-4 rounded" />
        <label htmlFor="activo" className="text-sm font-medium text-(--ink)">{t.activo}</label>
      </div>

      {/* Feedback */}
      {status && (
        <div className="rounded-lg px-4 py-3 text-sm border"
          style={{
            background: status.type === 'success' ? 'rgba(74,111,80,0.08)' : 'rgba(201,123,74,0.1)',
            borderColor: status.type === 'success' ? 'var(--green)' : 'var(--terra)',
            color: 'var(--ink)',
          }}>
          {status.msg}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.push(localePath(locale, '/admin/anunciantes'))}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}>
          {shared.volver}
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}>
          {loading ? shared.guardando : shared.guardar}
        </button>
      </div>
    </form>
  );
}
