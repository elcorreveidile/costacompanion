'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearAnunciante, asignarAnuncianteExistente } from '@/lib/admin/anunciantes';

function generarSlugLocal(nombre: string): string {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').replace(/-{2,}/g, '-');
}

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

const CATEGORIAS = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'salud',        label: 'Salud' },
  { value: 'legal',        label: 'Legal' },
  { value: 'restauracion', label: 'Restauración' },
  { value: 'comercio',     label: 'Comercio' },
  { value: 'otros',        label: 'Otros' },
];

const ZONAS = [
  'Estepona', 'Manilva', 'Casares', 'San Pedro de Alcántara', 'Puerto Banús', 'Benahavís',
  'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga', 'Otra Costa del Sol',
];

export default function NuevoAnunciantePage() {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const action = modo === 'nuevo' ? crearAnunciante : asignarAnuncianteExistente;
    const result = await action(formData);
    setLoading(false);
    if (result.error) { setError(result.error); } else { router.push('/admin/anunciantes'); }
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/admin" className="hover:text-(--ink) transition-colors">Admin</a>
          <span>›</span>
          <a href="/admin/anunciantes" className="hover:text-(--ink) transition-colors">Anunciantes</a>
          <span>›</span>
          <span className="text-(--ink)/80">Nuevo</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-6">Nuevo anunciante</h1>

        <div className="flex rounded-xl border p-1 mb-8 gap-1" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
          {(['nuevo', 'existente'] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setModo(m); setError(null); }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: modo === m ? 'var(--green)' : 'transparent', color: modo === m ? 'var(--bone)' : 'var(--ink)' }}>
              {m === 'nuevo' ? 'Crear cuenta nueva' : 'Asignar usuario existente'}
            </button>
          ))}
        </div>

        <div className="rounded-xl border shadow-sm p-8" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
          {modo === 'existente' && (
            <p className="text-sm text-(--ink)/60 mb-6 p-4 rounded-lg" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
              El usuario ya tiene cuenta. Se le cambiará el rol a anunciante y se le creará su ficha.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className={labelClass}>Email <span style={{ color: 'var(--terra)' }}>*</span></label>
              <input name="email" type="email" required placeholder="negocio@email.com" className={inputClass} style={inputStyle} />
            </div>

            {/* Nombre del negocio */}
            <div>
              <label className={labelClass}>Nombre del negocio <span style={{ color: 'var(--terra)' }}>*</span></label>
              <input name="nombre_negocio" type="text" required value={nombre} onChange={handleNombreChange}
                placeholder="Inmobiliaria Costa Azul" className={inputClass} style={inputStyle} />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>
                Slug (URL pública)
                <span className="ml-2 text-xs font-normal text-(--ink)/50">Auto-generado</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--ink)/40 shrink-0">costacompanion.com/local-partners/</span>
                <input name="slug" type="text" value={slug} onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
                  placeholder="nombre-negocio" className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono outline-none"
                  style={inputStyle} />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría <span style={{ color: 'var(--terra)' }}>*</span></label>
              <select name="categoria" required className={inputClass} style={inputStyle}>
                <option value="">Seleccionar categoría</option>
                {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Zona */}
            <div>
              <label className={labelClass}>Zona principal</label>
              <select name="zona" className={inputClass} style={inputStyle}>
                <option value="">Sin zona específica</option>
                {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {/* Plan */}
            <div>
              <label className={labelClass}>Plan</label>
              <select name="plan" className={inputClass} style={inputStyle}>
                <option value="basico">Básico — 29 €/mes</option>
                <option value="destacado">Destacado — 79 €/mes</option>
              </select>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm border"
                style={{ background: 'rgba(201,123,74,0.1)', borderColor: 'var(--terra)', color: 'var(--ink)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push('/admin/anunciantes')}
                className="flex-1 py-3 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                {loading ? 'Guardando...' : modo === 'nuevo' ? 'Crear anunciante' : 'Asignar como anunciante'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
