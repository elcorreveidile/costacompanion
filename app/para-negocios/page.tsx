import Image from 'next/image';
import { FormNegocio } from './FormNegocio';
import { getI18n } from '@/lib/i18n/server';

export const metadata = {
  title: 'Para negocios — Local Partners | Costa Companion',
  description: 'Anuncia tu negocio ante la comunidad internacional de la Costa del Sol.',
};

const waNum = process.env.NEXT_PUBLIC_WHATSAPP ?? '';
const waHref = waNum ? `https://wa.me/${waNum.replace(/\D/g, '')}` : '#';

const precioBasico           = process.env.NEXT_PUBLIC_PRICE_DISPLAY_PARTNER_BASIC            ?? '29 €';
const precioDestacado        = process.env.NEXT_PUBLIC_PRICE_DISPLAY_PARTNER_FEATURED         ?? '79 €';
const precioBasicoAnual      = process.env.NEXT_PUBLIC_PRICE_DISPLAY_PARTNER_BASIC_ANNUAL     ?? '290 €';
const precioDestacadoAnual   = process.env.NEXT_PUBLIC_PRICE_DISPLAY_PARTNER_FEATURED_ANNUAL  ?? '790 €';

export default async function ParaNegociosPage() {
  const { locale, dict } = await getI18n();
  const t = dict.paraNegocios;
  const POR_QUE = t.porQue.items;
  const oAnual = (precio: string) => t.planes.oAnual.replace('{precio}', precio);
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      {/* Hero */}
      <section className="relative py-20 px-6 text-center overflow-hidden" style={{ background: 'var(--green)' }}>
        <Image
          src="/images/estepona-atardecer-gibraltar.jpg"
          alt="Atardecer sobre el mar con Gibraltar al fondo"
          fill
          className="object-cover"
          style={{ opacity: 0.3 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(28,50,38,0.45) 0%, rgba(28,50,38,0.8) 100%)' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
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

        {/* Por qué anunciarte */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
            {t.porQue.h2}
          </h2>
          <div className="space-y-6">
            {POR_QUE.map((item) => (
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

        {/* Planes */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--green)' }}>
            {t.planes.h2}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Básico */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-3"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--green)' }}>{t.planes.basicoNombre}</h3>
                <div className="text-right shrink-0">
                  <div>
                    <span className="text-xl font-bold" style={{ color: 'var(--terra)' }}>{precioBasico}</span>
                    <span className="text-sm font-normal" style={{ color: 'var(--ink)', opacity: 0.5 }}>{t.planes.mes}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink)', opacity: 0.45 }}>
                    {oAnual(precioBasicoAnual)} <span style={{ color: 'var(--terra)' }}>{t.planes.dosMesesGratis}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                {t.planes.basicoDesc}
              </p>
            </div>
            {/* Destacado */}
            <div
              className="rounded-xl border-2 p-6 flex flex-col gap-3 relative overflow-hidden"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}
            >
              <div
                className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                {t.planes.recomendado}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--green)' }}>{t.planes.destacadoNombre}</h3>
                <div className="text-right shrink-0">
                  <div>
                    <span className="text-xl font-bold" style={{ color: 'var(--terra)' }}>{precioDestacado}</span>
                    <span className="text-sm font-normal" style={{ color: 'var(--ink)', opacity: 0.5 }}>{t.planes.mes}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink)', opacity: 0.45 }}>
                    {oAnual(precioDestacadoAnual)} <span style={{ color: 'var(--terra)' }}>{t.planes.dosMesesGratis}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                {t.planes.destacadoDesc}
              </p>
            </div>
          </div>
        </section>

        {/* Formulario de alta */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: 'var(--green)' }}>
            {t.alta.h2}
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--ink)', opacity: 0.72 }}>
            {t.alta.texto}
          </p>
          <FormNegocio
            precioBasico={precioBasico}
            precioDestacado={precioDestacado}
            precioBasicoAnual={precioBasicoAnual}
            precioDestacadoAnual={precioDestacadoAnual}
            waHref={waHref}
            t={t.form}
          />
        </section>
      </div>
    </div>
  );
}
