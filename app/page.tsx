import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { LocalPartnersDestacados } from '@/components/LocalPartnersDestacados';
import {
  IconSalud, IconTramites, IconNotaria, IconPropiedad,
  IconBanca, IconTelefono, IconEntrevista, IconEspanol,
} from '@/components/icons/ServiceIcons';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

const SERVICIO_ICONS = [
  IconSalud, IconTramites, IconNotaria, IconPropiedad,
  IconBanca, IconTelefono, IconEntrevista, IconEspanol,
];
const PASO_NUMS = ['01', '02', '03'];

export default async function Home() {
  const { locale, dict } = await getI18n();
  const t = dict.home;
  const lp = (href: string) => localePath(locale, href);
  const SERVICIOS = t.servicios.items.map((it, i) => ({ ...it, icon: SERVICIO_ICONS[i] }));
  const PASOS = t.pasos.items.map((it, i) => ({ ...it, num: PASO_NUMS[i] }));
  const CONFIANZA = t.confianza.items;
  return (
    <div className="flex flex-col">

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center min-h-[88vh] px-6 py-24 text-center overflow-hidden"
        style={{ background: 'var(--green)' }}
      >
        <Image
          src="/images/hero-mar.jpg"
          alt="Mar Mediterráneo con el Peñón de Gibraltar al fondo"
          fill
          priority
          className="object-cover"
          style={{ opacity: 0.35 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(28,50,38,0.45) 0%, rgba(28,50,38,0.78) 100%)' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <p className="text-sm font-medium tracking-widest uppercase" style={{ color: 'rgba(247,244,239,0.6)' }}>
            {t.hero.eyebrow}
          </p>
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight"
            style={{ color: 'var(--bone)' }}
          >
            {t.hero.titleLine1}<br />{t.hero.titleLine2}
          </h1>
          <p className="text-lg sm:text-xl max-w-xl leading-relaxed" style={{ color: 'rgba(247,244,239,0.82)' }}>
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href={lp('/directorio')}
              className="px-8 py-4 rounded-lg text-base font-medium transition-opacity hover:opacity-85"
              style={{ background: 'var(--terra)', color: 'var(--bone)' }}
            >
              {t.hero.ctaFind}
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-4 rounded-lg text-base font-medium border transition-opacity hover:opacity-75"
              style={{ borderColor: 'rgba(247,244,239,0.45)', color: 'rgba(247,244,239,0.85)' }}
            >
              {t.hero.ctaHow}
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. EL PROBLEMA / LA PROMESA ──────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone)' }}>
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
            {t.problema.h2}
          </h2>
          <div className="text-base sm:text-lg leading-relaxed space-y-5 text-left" style={{ color: 'var(--ink)' }}>
            <p>
              {t.problema.p1}
            </p>
            <p>
              {t.problema.p2pre}
              <span className="font-medium" style={{ color: 'var(--terra)' }}>{t.problema.p2em}</span>
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 3. CÓMO FUNCIONA ─────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-6" style={{ background: 'var(--bone-2)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--green)' }}>
              {t.pasos.h2}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {PASOS.map((paso, i) => (
              <ScrollReveal key={paso.num} delay={i * 120} className="flex flex-col gap-4">
                <div
                  className="font-display text-5xl font-light"
                  style={{ color: 'var(--terra)', opacity: 0.55 }}
                >
                  {paso.num}
                </div>
                <h3 className="font-display text-xl font-medium" style={{ color: 'var(--green)' }}>
                  {paso.titulo}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.72 }}>
                  {paso.texto}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. SERVICIOS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-4">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--green)' }}>
              {t.servicios.h2}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={80} className="text-center mb-12">
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--ink)', opacity: 0.62 }}>
              {t.servicios.subtitle}
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICIOS.map((srv, i) => (
              <ScrollReveal key={srv.titulo} delay={i * 55}>
                <div
                  className="h-full rounded-xl border p-5 flex flex-col gap-3"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--green)', color: 'var(--bone)' }}
                  >
                    <srv.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-base font-medium" style={{ color: 'var(--green)' }}>
                    {srv.titulo}
                  </h3>
                  <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--ink)', opacity: 0.65 }}>
                    {srv.texto}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={200} className="text-center mt-10">
            <Link
              href={lp('/servicios')}
              className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--terra)' }}
            >
              {t.servicios.verTodos}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. POR QUÉ COSTA COMPANION ──────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone-2)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--green)' }}>
              {t.confianza.h2}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {CONFIANZA.map((item, i) => (
              <ScrollReveal key={item.titulo} delay={i * 100} className="flex gap-4">
                <div className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--terra)' }} />
                <div>
                  <h3 className="font-display text-lg font-medium mb-2" style={{ color: 'var(--green)' }}>
                    {item.titulo}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                    {item.texto}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. DOBLE CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal>
            <div
              className="rounded-2xl p-10 flex flex-col gap-5 h-full"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              <h3 className="font-display text-2xl font-semibold">
                {t.ctaDoble.acomp.h3}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(247,244,239,0.78)' }}>
                {t.ctaDoble.acomp.texto}
              </p>
              <Link
                href={lp('/para-acompanantes')}
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--terra)', color: 'var(--bone)' }}
              >
                {t.ctaDoble.acomp.cta}
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div
              className="rounded-2xl border p-10 flex flex-col gap-5 h-full"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--green)' }}>
                {t.ctaDoble.negocio.h3}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                {t.ctaDoble.negocio.texto}
              </p>
              <Link
                href={lp('/para-negocios')}
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                {t.ctaDoble.negocio.cta}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Local Partners destacados ─────────────────────────────────────── */}
      <div className="px-6 pb-8" style={{ background: 'var(--bone)' }}>
        <div className="max-w-5xl mx-auto">
          <LocalPartnersDestacados />
        </div>
      </div>

      {/* ── 7. CIERRE CON FOTO ───────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center py-28 px-6 text-center overflow-hidden"
        style={{ background: 'var(--terra)' }}
      >
        <Image
          src="/images/atardecer.jpg"
          alt="Atardecer en la Costa del Sol"
          fill
          className="object-cover"
          style={{ opacity: 0.28 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(201,123,74,0.5), rgba(180,100,50,0.82))' }}
        />
        <ScrollReveal className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--bone)' }}>
            {t.cierre.h2}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(247,244,239,0.88)' }}>
            {t.cierre.texto}
          </p>
          <Link
            href={lp('/directorio')}
            className="px-8 py-4 rounded-lg text-base font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            {t.cierre.cta}
          </Link>
        </ScrollReveal>
      </section>

    </div>
  );
}
