'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearAcompanante, asignarAcompananteExistente } from '@/lib/admin/acompanantes';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { localePath, type Locale } from '@/lib/i18n/config';

type AdminDict = Dictionary['panelAdmin'];

function generarSlugLocal(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-');
}

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

interface Props {
  dict: AdminDict;
  locale: Locale;
}

export default function NuevoAcompananteClient({ dict, locale }: Props) {
  const t = dict.acompanantes;
  const tn = t.nuevo;
  const shared = dict.shared;

  const router = useRouter();
  const [modo, setModo] = useState<'nuevo' | 'existente'>('nuevo');
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{ numeroUsuario?: string; pin?: string } | null>(null);

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNombre(val);
    if (!slugManual) setSlug(generarSlugLocal(val));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManual(true);
    setSlug(e.target.value);
  }

  function handleModoChange(nuevo: 'nuevo' | 'existente') {
    setModo(nuevo);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = modo === 'nuevo' ? crearAcompanante : asignarAcompananteExistente;
    const result = await action(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.numeroUsuario || result.pin) {
      // Mostrar las credenciales una sola vez: el PIN no se puede recuperar después.
      setCreds({ numeroUsuario: result.numeroUsuario, pin: result.pin });
    } else {
      router.push(localePath(locale, '/admin/acompanantes'));
    }
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, '/admin')} className="hover:text-(--ink) transition-colors">{shared.admin}</a>
          <span>›</span>
          <a href={localePath(locale, '/admin/acompanantes')} className="hover:text-(--ink) transition-colors">{t.breadcrumb}</a>
          <span>›</span>
          <span className="text-(--ink)/80">{tn.breadcrumb}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-6">
          {tn.h1}
        </h1>

        {/* Toggle nuevo / existente */}
        <div
          className="flex rounded-xl border p-1 mb-8 gap-1"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <button
            type="button"
            onClick={() => handleModoChange('nuevo')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: modo === 'nuevo' ? 'var(--green)' : 'transparent',
              color: modo === 'nuevo' ? 'var(--bone)' : 'var(--ink)',
            }}
          >
            {tn.crearCuentaNueva}
          </button>
          <button
            type="button"
            onClick={() => handleModoChange('existente')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: modo === 'existente' ? 'var(--green)' : 'transparent',
              color: modo === 'existente' ? 'var(--bone)' : 'var(--ink)',
            }}
          >
            {tn.asignarExistente}
          </button>
        </div>

        {creds ? (
          <div
            className="rounded-xl border shadow-sm p-8"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}
          >
            <h2 className="font-display text-xl font-semibold text-(--green) mb-2">
              {tn.creadoTitulo}
            </h2>
            <p className="text-sm text-(--ink)/70 mb-6">
              {tn.credsAvisoPre}
              <strong>{tn.credsAvisoStrong}</strong>
              {tn.credsAvisoPost}
            </p>

            <div className="space-y-4">
              {creds.numeroUsuario && (
                <div className="rounded-lg p-4" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
                  <p className="text-xs text-(--ink)/50 mb-1">{shared.numeroUsuario}</p>
                  <p className="text-2xl font-mono font-semibold tracking-widest text-(--ink)">
                    {creds.numeroUsuario}
                  </p>
                </div>
              )}
              {creds.pin ? (
                <div className="rounded-lg p-4" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
                  <p className="text-xs text-(--ink)/50 mb-1">{tn.pinLabel}</p>
                  <p className="text-2xl font-mono font-semibold tracking-widest text-(--ink)">
                    {creds.pin}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-(--ink)/60">
                  {tn.yaTeniaPin}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push(localePath(locale, '/admin/acompanantes'))}
              className="mt-8 w-full py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              {tn.entendidoListado}
            </button>
          </div>
        ) : (
        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          {modo === 'existente' && (
            <p className="text-sm text-(--ink)/60 mb-6 p-4 rounded-lg" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
              {tn.existenteNota}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className={labelClass}>
                {modo === 'existente' ? tn.emailLabelExistente : tn.emailLabel} <span style={{ color: 'var(--terra)' }}>*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder={tn.emailPlaceholder}
                className={inputClass}
                style={inputStyle}
              />
              {modo === 'existente' && (
                <p className="text-xs text-(--ink)/40 mt-1">
                  {tn.emailNota}
                </p>
              )}
            </div>

            {/* Nombre público */}
            <div>
              <label className={labelClass}>
                {tn.nombrePublico} <span style={{ color: 'var(--terra)' }}>*</span>
              </label>
              <input
                name="nombre_publico"
                type="text"
                required
                value={nombre}
                onChange={handleNombreChange}
                placeholder={tn.nombrePublicoPlaceholder}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>
                {tn.slugLabel}
                <span className="ml-2 text-xs font-normal text-(--ink)/50">{tn.slugAuto}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--ink)/40 shrink-0">costacompanion.com/</span>

                <input
                  name="slug"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder={tn.slugPlaceholder}
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono outline-none`}
                  style={inputStyle}
                />
              </div>
              <p className="text-xs text-(--ink)/40 mt-1">{tn.slugNota}</p>
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm border"
                style={{ background: 'rgba(201,123,74,0.1)', borderColor: 'var(--terra)', color: 'var(--ink)' }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(localePath(locale, '/admin/acompanantes'))}
                className="flex-1 py-3 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
              >
                {shared.cancelar}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                {loading
                  ? (modo === 'nuevo' ? tn.creando : tn.asignando)
                  : (modo === 'nuevo' ? tn.crear : tn.asignar)}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
