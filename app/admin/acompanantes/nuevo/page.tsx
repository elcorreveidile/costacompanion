'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearAcompanante } from '@/lib/admin/acompanantes';

function generarSlugCliente(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-');
}

export default function NuevoAcompanantePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNombre(val);
    if (!slugManual) {
      setSlug(generarSlugCliente(val));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManual(true);
    setSlug(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await crearAcompanante(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/admin/acompanantes');
    }
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/admin" className="hover:text-(--ink) transition-colors">Admin</a>
          <span>›</span>
          <a href="/admin/acompanantes" className="hover:text-(--ink) transition-colors">Acompañantes</a>
          <span>›</span>
          <span className="text-(--ink)/80">Nuevo</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-8">
          Nuevo acompañante
        </h1>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ink)' }}
              >
                Email <span className="text-(--terra)">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--bone)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            {/* Nombre público */}
            <div>
              <label
                htmlFor="nombre_publico"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ink)' }}
              >
                Nombre público <span className="text-(--terra)">*</span>
              </label>
              <input
                id="nombre_publico"
                name="nombre_publico"
                type="text"
                required
                value={nombre}
                onChange={handleNombreChange}
                placeholder="Nombre que verán los clientes"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--bone)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ink)' }}
              >
                Slug (URL pública)
                <span className="ml-2 text-xs font-normal text-(--ink)/50">
                  Auto-generado desde el nombre
                </span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--ink)/40 shrink-0">costacompanion.es/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="nombre-del-acompanante"
                  className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono outline-none focus:ring-2"
                  style={{
                    background: 'var(--bone)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
              <p className="text-xs text-(--ink)/40 mt-1">
                Solo letras, números y guiones. Debe ser único.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm border"
                style={{
                  background: 'var(--terra-soft)',
                  borderColor: 'var(--terra)',
                  color: 'var(--ink)',
                }}
              >
                {error}
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/acompanantes')}
                className="flex-1 py-3 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                {loading ? 'Creando...' : 'Crear acompañante'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
