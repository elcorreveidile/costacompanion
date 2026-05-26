export const metadata = { title: 'Política de privacidad | Costa Companion' };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-6 text-sm space-x-2" style={{ color: 'var(--ink)', opacity: 0.5 }}>
          <a href="/" className="hover:opacity-80 transition-opacity">Inicio</a>
          <span>›</span>
          <span>Política de privacidad</span>
        </div>
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
          Política de privacidad
        </h1>
        <div
          className="rounded-xl border p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          <p
            className="text-sm font-medium px-4 py-3 rounded-lg mb-6"
            style={{ background: 'rgba(201,123,74,0.1)', color: 'var(--terra)' }}
          >
            [Contenido legal pendiente de revisión — Fase 10]
          </p>
          <p className="text-sm leading-relaxed" style={{ opacity: 0.6 }}>
            Este documento describirá cómo Costa Companion recoge, utiliza y protege los datos personales de los usuarios, de conformidad con el RGPD y la LOPDGDD.
          </p>
        </div>
      </div>
    </div>
  );
}
