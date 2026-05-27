import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { LocalPartnersDestacados } from '@/components/LocalPartnersDestacados';
import {
  IconSalud, IconTramites, IconNotaria, IconPropiedad,
  IconBanca, IconTelefono, IconEntrevista, IconEspanol,
} from '@/components/icons/ServiceIcons';

const SERVICIOS = [
  {
    icon: IconSalud,
    titulo: 'Salud',
    texto: 'Acompañamiento al médico, a urgencias o al especialista. Explicar lo que te pasa y entender el diagnóstico, sin perderte en la consulta.',
  },
  {
    icon: IconTramites,
    titulo: 'Trámites y administración',
    texto: 'Policía, denuncias, Extranjería y NIE, empadronamiento, citas oficiales. La burocracia española, en tu idioma.',
  },
  {
    icon: IconNotaria,
    titulo: 'Notaría y gestoría',
    texto: 'Firmas, poderes, documentos oficiales. Saber qué estás firmando antes de firmarlo.',
  },
  {
    icon: IconPropiedad,
    titulo: 'Compraventa de propiedades',
    texto: 'Visitas, negociación, firma. Acompañamiento en una de las decisiones más importantes que tomarás aquí.',
  },
  {
    icon: IconBanca,
    titulo: 'Banca',
    texto: 'Abrir o gestionar cuentas, entender las condiciones, hablar con tu oficina.',
  },
  {
    icon: IconTelefono,
    titulo: 'Interpretación telefónica urgente',
    texto: 'Cuando necesitas a alguien al teléfono ahora mismo, en directo.',
  },
  {
    icon: IconEntrevista,
    titulo: 'Preparación de entrevistas',
    texto: 'Para llegar con seguridad a una entrevista de trabajo.',
  },
  {
    icon: IconEspanol,
    titulo: 'Clases de español',
    texto: 'Adaptadas a tu nivel, desde lo básico hasta la conversación. Sueltas o en bonos.',
  },
];

const PASOS = [
  {
    num: '01',
    titulo: 'Elige a tu acompañante',
    texto: 'Busca por idioma, por tipo de gestión y por zona. Cada acompañante tiene su perfil, su experiencia y las valoraciones de quienes ya han contado con él.',
  },
  {
    num: '02',
    titulo: 'Reserva la cita',
    texto: 'Propón el día y la hora, o cuéntale lo que necesitas y deja que te proponga. Tú decides si es en persona o a distancia.',
  },
  {
    num: '03',
    titulo: 'Habla con tu acompañante',
    texto: 'Desde que reservas, tienes un chat directo con tu acompañante dentro de la plataforma. Resolved las dudas, concretad los detalles y llegad al día de la gestión con todo claro.',
  },
  {
    num: '04',
    titulo: 'No vas solo',
    texto: 'El día señalado, tu acompañante está contigo. Antes, durante y después. Para que salgas sabiendo exactamente qué ha pasado y qué viene ahora.',
  },
];

const CONFIANZA = [
  {
    titulo: 'Acompañantes de confianza',
    texto: 'Cada persona de nuestra red entra de una en una, conocida y verificada. No somos un listado abierto: somos una red cuidada.',
  },
  {
    titulo: 'En tu idioma',
    texto: 'Español, inglés, francés, alemán y neerlandés. Encuentra a alguien que hable el tuyo con naturalidad.',
  },
  {
    titulo: 'A tu medida',
    texto: 'Cada acompañante pone sus servicios y sus precios. Tú eliges lo que encaja contigo, sin sorpresas.',
  },
  {
    titulo: 'Cerca, siempre',
    texto: 'En persona para lo que requiere estar allí; por teléfono, videollamada o chat para lo que se resuelve en el momento.',
  },
];

export default function Home() {
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
            Acompañamiento lingüístico en la Costa del Sol
          </p>
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight"
            style={{ color: 'var(--bone)' }}
          >
            A tu lado,<br />en tu idioma
          </h1>
          <p className="text-lg sm:text-xl max-w-xl leading-relaxed" style={{ color: 'rgba(247,244,239,0.82)' }}>
            Alguien de confianza que te acompaña al médico, a la policía, al notario o al banco, y habla por ti cuando el idioma se interpone. Para que vivir aquí se sienta como estar en casa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/directorio"
              className="px-8 py-4 rounded-lg text-base font-medium transition-opacity hover:opacity-85"
              style={{ background: 'var(--terra)', color: 'var(--bone)' }}
            >
              Encontrar a mi acompañante
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-4 rounded-lg text-base font-medium border transition-opacity hover:opacity-75"
              style={{ borderColor: 'rgba(247,244,239,0.45)', color: 'rgba(247,244,239,0.85)' }}
            >
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. EL PROBLEMA / LA PROMESA ──────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone)' }}>
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
            Vivir aquí no debería significar quedarse sin palabras
          </h2>
          <div className="text-base sm:text-lg leading-relaxed space-y-5 text-left" style={{ color: 'var(--ink)' }}>
            <p>
              Conoces la sensación: llevas tiempo en la costa, te defiendes en el día a día, pero llega el momento de explicarle unos síntomas al médico, entender un contrato o poner una denuncia, y de pronto el idioma se vuelve un muro. No es cuestión de saber más o menos español. Es que hay momentos en los que necesitas estar seguro de que te entienden, y de que entiendes tú.
            </p>
            <p>
              Para esos momentos existe Costa Companion: personas que hablan tu idioma y el de aquí, y que se sientan a tu lado en la gestión que sea.{' '}
              <span className="font-medium" style={{ color: 'var(--terra)' }}>No traducen y se van. Te acompañan, como lo haría un buen vecino.</span>
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 3. CÓMO FUNCIONA ─────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-6" style={{ background: 'var(--bone-2)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--green)' }}>
              Sencillo, desde el primer momento
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {PASOS.map((paso, i) => (
              <ScrollReveal key={paso.num} delay={i * 100} className="flex flex-col gap-4">
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
              Para casi todo lo que la vida aquí te pide
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={80} className="text-center mb-12">
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--ink)', opacity: 0.62 }}>
              Estas son algunas de las gestiones en las que nuestros acompañantes te asisten. Si lo tuyo no está en la lista, pregúntanos: casi siempre podemos ayudar.
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
              href="/servicios"
              className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--terra)' }}
            >
              Ver todos los servicios
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. VECINDAD ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'var(--green)' }}>
        <ScrollReveal className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <p
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'rgba(247,244,239,0.55)' }}
          >
            Más que un servicio
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold leading-tight"
            style={{ color: 'var(--bone)' }}
          >
            Aquí no eres un extranjero:<br />eres un vecino más
          </h2>
          <div
            className="text-base sm:text-lg leading-relaxed space-y-5 text-left max-w-2xl"
            style={{ color: 'rgba(247,244,239,0.78)' }}
          >
            <p>
              Costa Companion nació de una idea sencilla: que nadie tenga que sentirse de fuera en el lugar donde ha decidido vivir, o que ha venido a disfrutar. Cuando alguien te acompaña con cercanía, cuando el comercio del barrio te atiende en tu idioma y con una sonrisa, cuando entiendes lo que pasa a tu alrededor, algo cambia: dejas de estar de paso y empiezas a formar parte.
            </p>
            <p>
              Eso es lo que cuidamos. Nuestros acompañantes y los negocios de nuestra red comparten una misma manera de hacer las cosas: con amabilidad, con paciencia, tratándote como a un vecino. Así se teje, gesto a gesto, un clima de vecindad e integración del que se benefician todos.
            </p>
          </div>
          <p
            className="text-base font-medium mt-2"
            style={{ color: 'rgba(247,244,239,0.9)' }}
          >
            Porque integrarse no es solo aprender el idioma. Es sentirse en casa.
          </p>
        </ScrollReveal>
      </section>

      {/* ── 6. POR QUÉ COSTA COMPANION ──────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone-2)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--green)' }}>
              Más que un idioma: tranquilidad
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

      {/* ── 7. DOBLE CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'var(--bone)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal>
            <div
              className="rounded-2xl p-10 flex flex-col gap-5 h-full"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              <h3 className="font-display text-2xl font-semibold">
                ¿Hablas idiomas y te gusta ayudar?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(247,244,239,0.78)' }}>
                Si conoces la costa, hablas varios idiomas y disfrutas acompañando a las personas en los momentos que importan, hay un sitio para ti en Costa Companion. Trabajas a tu manera, con tus precios y tu propio perfil. Y formas parte de algo: una red que hace de esta costa un lugar más acogedor.
              </p>
              <Link
                href="/para-acompanantes"
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--terra)', color: 'var(--bone)' }}
              >
                Quiero ser acompañante
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div
              className="rounded-2xl border p-10 flex flex-col gap-5 h-full"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--green)' }}>
                ¿Tienes un negocio en la costa?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                Llega a la comunidad internacional de Estepona y Marbella y forma parte de una red que cuida a quien viene de fuera. Si tu negocio trata bien a los residentes extranjeros —una clínica, una inmobiliaria, una gestoría, un comercio—, preséntate ante quienes te buscan.
              </p>
              <Link
                href="/para-negocios"
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                Anunciar mi negocio
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

      {/* ── 8. CIERRE CON FOTO ───────────────────────────────────────────── */}
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
            Da el primer paso hoy
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(247,244,239,0.88)' }}>
            Tu próxima gestión no tiene por qué hacerse en un idioma que no dominas, ni a solas. Encuentra a la persona que te acompaña.
          </p>
          <Link
            href="/directorio"
            className="px-8 py-4 rounded-lg text-base font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            Encontrar a mi acompañante
          </Link>
        </ScrollReveal>
      </section>

    </div>
  );
}
