import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

export const metadata = { title: 'Política de privacidad | Costa Companion' };

export default async function PrivacidadPage() {
  const { locale, dict } = await getI18n();
  const t = dict.legal;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-6 text-sm space-x-2" style={{ color: 'var(--ink)', opacity: 0.5 }}>
          <a href={localePath(locale, '/')} className="hover:opacity-80 transition-opacity">{t.inicio}</a>
          <span>›</span>
          <span>{t.privacidad.titulo}</span>
        </div>
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
          {t.privacidad.titulo}
        </h1>
        <div
          className="rounded-xl border p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          <p
            className="text-sm font-medium px-4 py-3 rounded-lg mb-6"
            style={{ background: 'rgba(201,123,74,0.1)', color: 'var(--terra)' }}
          >
            {t.pendiente}
          </p>
          <p className="text-sm leading-relaxed" style={{ opacity: 0.6 }}>
            {t.privacidad.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
