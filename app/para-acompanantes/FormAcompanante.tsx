'use client';
import { useState, useRef } from 'react';
import { enviarSolicitudAcompanante } from '@/lib/actions/solicitudAcompanante';
import { languageName, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

const IDIOMA_CODES = ['en', 'fr', 'de', 'nl', 'ru', 'zh', 'ar', 'pt', 'it'];

const ZONA_VALUES = [
  'Estepona', 'Manilva', 'Casares', 'San Pedro de Alcántara', 'Puerto Banús', 'Benahavís',
  'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga',
];

interface Props {
  waHref: string;
  locale: Locale;
  t: Dictionary['paraAcompanantes']['form'];
}

export function FormAcompanante({ waHref, locale, t }: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await enviarSolicitudAcompanante(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDone(true);
      formRef.current?.reset();
    }
  }

  if (done) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--green)' }}>
          {t.okTitulo}
        </h3>
        <p className="text-sm" style={{ color: 'var(--ink)', opacity: 0.7 }}>
          {t.okTexto}
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border p-8 space-y-5"
      style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.nombre} *
          </label>
          <input
            name="nombre"
            required
            type="text"
            placeholder={t.nombrePlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.email} *
          </label>
          <input
            name="email"
            required
            type="email"
            placeholder={t.emailPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          {t.telefono}
        </label>
        <input
          name="telefono"
          type="tel"
          placeholder={t.telefonoPlaceholder}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
          style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          {t.idiomas}
        </label>
        <div className="flex flex-wrap gap-2">
          {IDIOMA_CODES.map((code) => (
            <label key={code} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="idioma"
                value={code}
                className="rounded"
                style={{ accentColor: 'var(--green)' }}
              />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>{languageName(code, locale)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          {t.zona}
        </label>
        <select
          name="zona"
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          <option value="">{t.zonaPlaceholder}</option>
          {ZONA_VALUES.map((z) => <option key={z} value={z}>{z}</option>)}
          <option value="Toda la Costa del Sol">{t.todaCostaDelSol}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          {t.cuentanos}
        </label>
        <textarea
          name="mensaje"
          rows={4}
          placeholder={t.cuentanosPlaceholder}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
          style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-7 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          {pending ? t.enviando : t.enviar}
        </button>
        {waHref && waHref !== '#' && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--terra)' }}
          >
            {t.whatsapp}
          </a>
        )}
      </div>
    </form>
  );
}
