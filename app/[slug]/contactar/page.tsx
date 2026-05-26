'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { enviarContacto } from '@/lib/contactar/actions';

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

export default function ContactarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    fd.set('slug', slug);
    const result = await enviarContacto(fd);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEnviado(true);
    }
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <Link href={`/${slug}`} className="hover:text-(--ink) transition-colors">
            Perfil
          </Link>
          <span>›</span>
          <span className="text-(--ink)/80">Contactar</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Enviar mensaje
        </h1>
        <p className="text-(--ink)/60 mb-8">
          Escríbele directamente al acompañante. Recibirás su respuesta en tu email.
        </p>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          {enviado ? (
            <div className="text-center py-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--green)' }}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-medium text-(--green) mb-2">
                ¡Mensaje enviado!
              </h2>
              <p className="text-(--ink)/60 mb-6">
                El acompañante recibirá tu mensaje y podrá responderte directamente a tu email.
              </p>
              <Link
                href={`/${slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                Volver al perfil
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>
                  Tu nombre <span style={{ color: 'var(--terra)' }}>*</span>
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  placeholder="María García"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Tu email <span style={{ color: 'var(--terra)' }}>*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  className={inputClass}
                  style={inputStyle}
                />
                <p className="text-xs text-(--ink)/40 mt-1">
                  El acompañante usará este email para responderte.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Mensaje <span style={{ color: 'var(--terra)' }}>*</span>
                </label>
                <textarea
                  name="mensaje"
                  required
                  rows={5}
                  placeholder="Cuéntame en qué puedo ayudarte..."
                  className={`${inputClass} resize-y`}
                  style={inputStyle}
                />
              </div>

              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm border"
                  style={{
                    background: 'rgba(201,123,74,0.1)',
                    borderColor: 'var(--terra)',
                    color: 'var(--ink)',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Link
                  href={`/${slug}`}
                  className="flex-1 py-3 rounded-lg text-sm font-medium border text-center transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
                  style={{ background: 'var(--green)', color: 'var(--bone)' }}
                >
                  {loading ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
