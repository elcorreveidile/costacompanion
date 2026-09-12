import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

export const metadata = {
  title: 'Aviso de intermediación | Costa Companion',
};

export default async function IntermediacionPage() {
  const { locale, dict } = await getI18n();
  const t = dict.legal;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-6 text-sm space-x-2" style={{ color: 'var(--ink)', opacity: 0.5 }}>
          <a href={localePath(locale, '/')} className="hover:opacity-80 transition-opacity">{t.inicio}</a>
          <span>›</span>
          <span>{t.intermediacion.titulo}</span>
        </div>
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
          {t.intermediacion.titulo}
        </h1>
        <div
          className="rounded-xl border p-8 prose prose-sm max-w-none"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          <p className="text-base leading-relaxed">
            {t.intermediacion.p1}
          </p>
          <p className="text-base leading-relaxed mt-4">
            {t.intermediacion.p2}
          </p>
        </div>
      </div>
    </div>
  );
}
