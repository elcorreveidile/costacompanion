'use client';
import { useState, useRef } from 'react';
import { registrarNegocio } from '@/lib/actions/registroNegocio';

const CATEGORIAS = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'salud',        label: 'Salud' },
  { value: 'legal',        label: 'Legal / Gestoría' },
  { value: 'restauracion', label: 'Restauración' },
  { value: 'comercio',     label: 'Comercio' },
  { value: 'otros',        label: 'Otros' },
];

const ZONAS = [
  'Estepona', 'Manilva', 'Casares', 'San Pedro de Alcántara', 'Puerto Banús', 'Benahavís',
  'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga', 'Toda la Costa del Sol',
];

interface Props {
  precioBasico: string;
  precioDestacado: string;
  waHref: string;
}

export function FormNegocio({ precioBasico, precioDestacado, waHref }: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<'basico' | 'destacado'>('basico');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await registrarNegocio(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDone(true);
      formRef.current?.reset();
    }
  }

  if (done) {
    return (
      <div
        className="rounded-xl border p-10 text-center"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--green)' }}>
          Solicitud recibida
        </h3>
        <p className="text-sm" style={{ color: 'var(--ink)', opacity: 0.7 }}>
          Revisaremos tu ficha y te contactaremos para confirmar el alta. Tu negocio estará visible una vez aprobado.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border p-8 space-y-6"
      style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
    >
      {/* Plan selector */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          Plan *
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              { value: 'basico' as const, label: 'Básico', precio: precioBasico, desc: 'Ficha en el directorio Local Partners: logo, descripción y datos de contacto.' },
              { value: 'destacado' as const, label: 'Destacado', precio: precioDestacado, desc: 'Todo lo anterior más posición preferente y presencia destacada en la plataforma.' },
            ] as const
          ).map((p) => (
            <label
              key={p.value}
              className="flex flex-col gap-2 p-4 rounded-lg border cursor-pointer transition-all"
              style={{
                borderColor: plan === p.value ? 'var(--green)' : 'var(--line)',
                background: plan === p.value ? 'rgba(44,74,59,0.07)' : 'var(--bone)',
              }}
            >
              <input
                type="radio"
                name="plan"
                value={p.value}
                checked={plan === p.value}
                onChange={() => setPlan(p.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm" style={{ color: 'var(--green)' }}>{p.label}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--terra)' }}>{p.precio}/mes</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.6 }}>{p.desc}</p>
            </label>
          ))}
        </div>
      </div>

      {/* Datos del negocio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Nombre del negocio *
          </label>
          <input
            name="nombre_negocio"
            required
            type="text"
            placeholder="Tu negocio S.L."
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Categoría *
          </label>
          <select
            name="categoria"
            required
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value="">Selecciona</option>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Zona
          </label>
          <select
            name="zona"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value="">Selecciona una zona</option>
            {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Email de contacto *
          </label>
          <input
            name="email"
            required
            type="email"
            placeholder="hola@tunegocio.com"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Teléfono
          </label>
          <input
            name="telefono"
            type="tel"
            placeholder="+34 600 000 000"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            WhatsApp
          </label>
          <input
            name="whatsapp"
            type="tel"
            placeholder="+34 600 000 000"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Web
          </label>
          <input
            name="web"
            type="url"
            placeholder="https://tunegocio.com"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            Descripción breve de tu negocio
          </label>
          <textarea
            name="descripcion_es"
            rows={3}
            placeholder="Qué haces, a quién atiendes, qué te diferencia..."
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-7 py-3.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          {pending ? 'Enviando…' : 'Dar de alta mi negocio'}
        </button>
        {waHref !== '#' && (
          <a
            href={waHref}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--terra)' }}
          >
            ¿Dudas? Escríbenos por WhatsApp →
          </a>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--ink)', opacity: 0.45 }}>
        Revisaremos tu ficha antes de publicarla. Tu negocio estará visible una vez aprobado.
      </p>
    </form>
  );
}
