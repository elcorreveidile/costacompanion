import { FormAcompanante } from './FormAcompanante';
import { PageHero } from '@/components/layout/PageHero';

export const metadata = {
  title: 'Para acompañantes | Costa Companion',
  description: 'Únete a la red de acompañantes lingüísticos de Costa Companion en la Costa del Sol.',
};

const waNum = process.env.NEXT_PUBLIC_WHATSAPP ?? '';
const waHref = waNum ? `https://wa.me/${waNum.replace(/\D/g, '')}` : '#';

const COMO_FUNCIONA = [
  {
    titulo: 'Tu perfil, tu escaparate.',
    texto: 'Tienes tu propia página dentro de Costa Companion, con tus servicios, tu experiencia y tus valoraciones.',
  },
  {
    titulo: 'Tus servicios, tus precios.',
    texto: 'Tú decides qué ofreces y cuánto cuesta. Nosotros te damos la plataforma y los clientes; el trato es tuyo.',
  },
  {
    titulo: 'Tú eliges cada encargo.',
    texto: 'Recibes las solicitudes y aceptas las que te encajan. Sin obligaciones.',
  },
  {
    titulo: 'Te acompañamos al empezar.',
    texto: 'Te damos de alta, preparamos tu perfil contigo y te enseñamos a manejar todo. No te dejamos solo.',
  },
];

export default function ParaAcompanantesPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <PageHero
        imageSrc="/images/atardecer.jpg"
        imageAlt="Atardecer en la Costa del Sol"
        title="Acompaña. A tu manera."
        subtitle="Costa Companion es una red de personas que hablan idiomas y conocen la costa, y que ayudan a residentes y visitantes en las gestiones donde el idioma pesa. Pero somos algo más que eso: somos quienes hacen que el que llega de fuera se sienta un vecino más. Si eso te representa, hablemos."
      />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Cómo funciona para ti */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
            Cómo funciona para ti
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
            Qué pedimos
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.72 }}>
            Hablar bien español y al menos otro idioma, conocer la zona, y tratar a cada persona con la amabilidad y el cuidado que merece quien confía en ti para algo importante. La cercanía no se finge: se tiene.
          </p>
        </section>

        {/* Cómo entrar */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: 'var(--green)' }}>
            Cómo entrar
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--ink)', opacity: 0.72 }}>
            No es un alta automática: nos gusta conocer a cada acompañante antes de que entre en la red. Déjanos tus datos y te contactamos para conocernos.
          </p>
          <FormAcompanante waHref={waHref} />
        </section>
      </div>
    </div>
  );
}
