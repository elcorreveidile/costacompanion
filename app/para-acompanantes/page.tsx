import { FormAcompanante } from './FormAcompanante';
import { getI18n } from '@/lib/i18n/server';

export const metadata = {
  title: 'Para acompañantes | Costa Companion',
  description: 'Únete a la red de acompañantes lingüísticos de Costa Companion en la Costa del Sol.',
};

const waNum = process.env.NEXT_PUBLIC_WHATSAPP ?? '';
const waHref = waNum ? `https://wa.me/${waNum.replace(/\D/g, '')}` : '#';

export default async function ParaAcompanantesPage() {
  const { locale, dict } = await getI18n();
  const t = dict.paraAcompanantes;
  const COMO_FUNCIONA = t.comoFunciona.items;
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      {/* Hero */}
      <section className="py-20 px-6 text-center" style={{ background: 'var(--green)' }}>
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-display text-4xl sm:text-5xl font-semibold mb-4"
            style={{ color: 'var(--bone)' }}
          >
            {t.hero.h1}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(247,244,239,0.8)' }}>
            {t.hero.subtitle}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Cómo funciona para ti */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
            {t.comoFunciona.h2}
          </h2>
          <div className="space-y-6">
            {COMO_FUNCIONA.map((item) => (
              <div key={item.titulo} className="flex gap-4">
                <div
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{ background: 'var(--terra)' }}
                />
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--green)' }}>
                    {item.titulo}
                  </span>{' '}
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.72 }}>
                    {item.texto}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Qué pedimos */}
        <section
          className="rounded-xl border p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--green)' }}>
            {t.quePedimos.h2}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.72 }}>
            {t.quePedimos.texto}
          </p>
        </section>

        {/* Cómo entrar */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: 'var(--green)' }}>
            {t.comoEntrar.h2}
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--ink)', opacity: 0.72 }}>
            {t.comoEntrar.texto}
          </p>
          <FormAcompanante waHref={waHref} locale={locale} t={t.form} />
        </section>
      </div>
    </div>
  );
}
