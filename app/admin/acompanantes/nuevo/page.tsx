'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearAcompanante, asignarAcompananteExistente } from '@/lib/admin/acompanantes';

function generarSlugLocal(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-');
}

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

export default function NuevoAcompanantePage() {
  const router = useRouter();
  const [modo, setModo] = useState<'nuevo' | 'existente'>('nuevo');
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNombre(val);
    if (!slugManual) setSlug(generarSlugLocal(val));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManual(true);
    setSlug(e.target.value);
  }

  function handleModoChange(nuevo: 'nuevo' | 'existente') {
    setModo(nuevo);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = modo === 'nuevo' ? crearAcompanante : asignarAcompananteExistente;
    const result = await action(formData);

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

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-6">
          Nuevo acompañante
        </h1>

        {/* Toggle nuevo / existente */}
        <div
          className="flex rounded-xl border p-1 mb-8 gap-1"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <button
            type="button"
            onClick={() => handleModoChange('nuevo')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: modo === 'nuevo' ? 'var(--green)' : 'transparent',
              color: modo === 'nuevo' ? 'var(--bone)' : 'var(--ink)',
            }}
          >
            Crear cuenta nueva
          </button>
          <button
            type="button"
            onClick={() => handleModoChange('existente')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: modo === 'existente' ? 'var(--green)' : 'transparent',
              color: modo === 'existente' ? 'var(--bone)' : 'var(--ink)',
            }}
          >
            Asignar usuario existente
          </button>
        </div>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          {modo === 'existente' && (
            <p className="text-sm text-(--ink)/60 mb-6 p-4 rounded-lg" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
              El usuario ya tiene cuenta en la plataforma (registrado como cliente). Se le cambiará el rol a acompañante y se le creará su ficha.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className={labelClass}>
                Email {modo === 'existente' ? 'del usuario registrado' : ''} <span style={{ color: 'var(--terra)' }}>*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                className={inputClass}
                style={inputStyle}
              />
              {modo === 'existente' && (
                <p className="text-xs text-(--ink)/40 mt-1">
                  Debe coincidir exactamente con el email con el que se registró.
                </p>
              )}
            </div>

            {/* Nombre público */}
            <div>
              <label className={labelClass}>
                Nombre público <span style={{ color: 'var(--terra)' }}>*</span>
              </label>
              <input
                name="nombre_publico"
                type="text"
                required
                value={nombre}
                onChange={handleNombreChange}
                placeholder="Nombre que verán los clientes"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>
                Slug (URL pública)
                <span className="ml-2 text-xs font-normal text-(--ink)/50">Auto-generado desde el nombre</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--ink)/40 shrink-0">costacompanion.com/</span>

                <input
                  name="slug"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="nombre-del-acompanante"
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono outline-none`}
                  style={inputStyle}
                />
              </div>
              <p className="text-xs text-(--ink)/40 mt-1">Solo letras, números y guiones. Debe ser único.</p>
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm border"
                style={{ background: 'rgba(201,123,74,0.1)', borderColor: 'var(--terra)', color: 'var(--ink)' }}
              >
                {error}
              </div>
            )}

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
                {loading
                  ? (modo === 'nuevo' ? 'Creando...' : 'Asignando...')
                  : (modo === 'nuevo' ? 'Crear acompañante' : 'Asignar como acompañante')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
