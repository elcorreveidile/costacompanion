export const metadata = { title: 'Política de cookies | Costa Companion' };

export default function CookiesPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-6 text-sm space-x-2" style={{ color: 'var(--ink)', opacity: 0.5 }}>
          <a href="/" className="hover:opacity-80 transition-opacity">Inicio</a>
          <span>›</span>
          <span>Política de cookies</span>
        </div>
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--green)' }}>
          Política de cookies
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
            Este documento explicará qué cookies utiliza Costa Companion, para qué sirven y cómo el usuario puede gestionarlas o desactivarlas.
          </p>
        </div>
      </div>
    </div>
  );
}
