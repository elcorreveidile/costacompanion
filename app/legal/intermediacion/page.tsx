export const metadata = {
  title: 'Aviso de intermediación | Costa Companion',
};

export default function IntermediacionPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-6 text-sm space-x-2" style={{ color: 'var(--ink)', opacity: 0.5 }}>
          <a href="/" className="hover:opacity-80 transition-opacity">Inicio</a>
          <span>›</span>
          <span>Aviso de intermediación</span>
        </div>
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
          Aviso de intermediación
        </h1>
        <div
          className="rounded-xl border p-8 prose prose-sm max-w-none"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          <p className="text-base leading-relaxed">
            Costa Companion es una plataforma que pone en contacto a personas con acompañantes lingüísticos independientes. No prestamos directamente el servicio de interpretación ni respondemos de su resultado, y no intervenimos en el acuerdo económico entre las partes.
          </p>
          <p className="text-base leading-relaxed mt-4">
            Para actuaciones con valor legal (declaraciones ante la policía o los juzgados, firmas notariales) puede ser necesario un intérprete jurado oficial; te lo advertiremos cuando corresponda.
          </p>
        </div>
      </div>
    </div>
  );
}
