'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Anunciante } from '@/types/supabase';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { localePath, locales, localeNames, type Locale } from '@/lib/i18n/config';

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

interface Props {
  anunciante: Pick<Anunciante, 'descripcion' | 'logo_url' | 'web' | 'telefono' | 'email' | 'whatsapp' | 'nombre_negocio' | 'categoria' | 'zona' | 'plan' | 'direccion'>;
  action: (formData: FormData) => Promise<{ error?: string }>;
  t: Dictionary['panelAnunciante']['ficha'];
  locale: Locale;
}

export function FichaAnuncianteForm({ anunciante, action, t, locale }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const desc = (anunciante.descripcion ?? {}) as Record<string, string>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    setLoading(false);
    if (result.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setStatus({ type: 'success', msg: t.guardado });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info de solo lectura */}
      <div className="rounded-lg p-4 text-sm space-y-1" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
        <p className="font-medium text-(--ink)">{anunciante.nombre_negocio}</p>
        {anunciante.zona && <p className="text-(--ink)/60">{anunciante.zona}</p>}
        <p className="text-xs text-(--ink)/40">{t.infoGestionada}</p>
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelClass}>{t.logoUrl}</label>
        <input name="logo_url" type="url" defaultValue={anunciante.logo_url ?? ''}
          placeholder={t.logoUrlPlaceholder} className={inputClass} style={inputStyle} />
        <p className="text-xs text-(--ink)/40 mt-1">{t.logoNota}</p>
      </div>

      {/* Descripción por idioma */}
      <div className="space-y-3">
        <label className={labelClass}>{t.descripcion}</label>
        {locales.map((code) => (
          <div key={code}>
            <span className="block text-xs mb-1 text-(--ink)/50">{localeNames[code]}</span>
            <textarea
              name={`descripcion_${code}`}
              rows={code === 'es' || code === 'en' ? 4 : 2}
              defaultValue={desc[code] ?? ''}
              placeholder={code === locale ? t.descEsPlaceholder : ''}
              className={inputClass}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        ))}
      </div>

      {/* Web */}
      <div>
        <label className={labelClass}>{t.web}</label>
        <input name="web" type="url" defaultValue={anunciante.web ?? ''}
          placeholder={t.webPlaceholder} className={inputClass} style={inputStyle} />
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>{t.email}</label>
        <input name="email" type="email" defaultValue={anunciante.email ?? ''}
          placeholder={t.emailPlaceholder} className={inputClass} style={inputStyle} />
      </div>

      {/* Teléfono / WhatsApp */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.telefono}</label>
          <input name="telefono" type="tel" defaultValue={anunciante.telefono ?? ''}
            placeholder={t.telWhatsPlaceholder} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>{t.whatsapp}</label>
          <input name="whatsapp" type="tel" defaultValue={anunciante.whatsapp ?? ''}
            placeholder={t.telWhatsPlaceholder} className={inputClass} style={inputStyle} />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className={labelClass}>{t.direccion}</label>
        <input name="direccion" type="text" defaultValue={anunciante.direccion ?? ''}
          placeholder={t.direccionPlaceholder}
          className={inputClass} style={inputStyle} />
        <p className="text-xs text-(--ink)/40 mt-1">{t.direccionNota}</p>
      </div>

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
        <button type="button" onClick={() => router.push(localePath(locale, '/anunciante'))}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}>
          {t.volver}
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}>
          {loading ? t.guardando : t.guardar}
        </button>
      </div>
    </form>
  );
}
