import { FormNegocio } from './FormNegocio';

export const metadata = {
  title: 'Para negocios — Local Partners | Costa Companion',
  description: 'Anuncia tu negocio ante la comunidad internacional de la Costa del Sol.',
};

const waNum = process.env.NEXT_PUBLIC_WHATSAPP ?? '';
const waHref = waNum ? `https://wa.me/${waNum.replace(/\D/g, '')}` : '#';

const precioBasico    = process.env.NEXT_PUBLIC_PRICE_DISPLAY_PARTNER_BASIC    ?? '29 €';
const precioDestacado = process.env.NEXT_PUBLIC_PRICE_DISPLAY_PARTNER_FEATURED ?? '79 €';

const POR_QUE = [
  {
    titulo: 'El público adecuado.',
    texto: 'Quien llega a Costa Companion es, precisamente, la comunidad internacional que vive y gasta en la costa.',
  },
  {
    titulo: 'Un entorno de confianza.',
    texto: 'Apareces junto a una red cuidada de acompañantes, no en un tablón de anuncios. Eso te da contexto y credibilidad.',
  },
  {
    titulo: 'Tu ficha en su idioma.',
    texto: 'Tu presencia se muestra de forma cuidada y, próximamente, en los cinco idiomas de la plataforma.',
  },
];

export default function ParaNegociosPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      {/* Hero */}
      <section className="py-20 px-6 text-center" style={{ background: 'var(--green)' }}>
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-display text-4xl sm:text-5xl font-semibold mb-4"
            style={{ color: 'var(--bone)' }}
          >
            Tu negocio, ante la comunidad internacional de la costa
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(247,244,239,0.8)' }}>
            Cada día, residentes extranjeros de Estepona, Marbella, San Pedro, Benahavís, Manilva, Casares y Puerto Banús buscan negocios en los que confiar: una clínica que les entienda, una inmobiliaria seria, una gestoría que les resuelva, un sitio donde se sientan bien atendidos. Costa Companion te pone delante de ellos.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Por qué anunciarte */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
            Por qué anunciarte aquí
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
            Planes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              className="rounded-xl border p-6 flex flex-col gap-3"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--green)' }}>Básico</h3>
                <span className="text-xl font-bold" style={{ color: 'var(--terra)' }}>{precioBasico}<span className="text-sm font-normal">/mes</span></span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                Tu ficha en el directorio Local Partners: logo, descripción, categoría, zona y datos de contacto.
              </p>
            </div>
            <div
              className="rounded-xl border-2 p-6 flex flex-col gap-3 relative overflow-hidden"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}
            >
              <div
                className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                Recomendado
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--green)' }}>Destacado</h3>
                <span className="text-xl font-bold" style={{ color: 'var(--terra)' }}>{precioDestacado}<span className="text-sm font-normal">/mes</span></span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                Todo lo del plan Básico, más posición preferente en el directorio y presencia destacada en las zonas más visitadas de la plataforma.
              </p>
            </div>
          </div>
        </section>

        {/* Formulario de alta */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: 'var(--green)' }}>
            Cómo darte de alta
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--ink)', opacity: 0.72 }}>
            Rellena tus datos, elige tu plan y completa el alta. Revisaremos tu ficha y, una vez aprobada, tu negocio estará visible en Costa Companion. Cuidamos quién aparece, por respeto a quienes nos confían sus gestiones.
          </p>
          <FormNegocio
            precioBasico={precioBasico}
            precioDestacado={precioDestacado}
            waHref={waHref}
          />
        </section>
      </div>
    </div>
  );
}
