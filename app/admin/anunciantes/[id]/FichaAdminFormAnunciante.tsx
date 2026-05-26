'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarAnunciante } from '@/lib/admin/anunciantes';
import type { Anunciante } from '@/types/supabase';

const CATEGORIAS = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'salud',        label: 'Salud' },
  { value: 'legal',        label: 'Legal' },
  { value: 'restauracion', label: 'Restauración' },
  { value: 'comercio',     label: 'Comercio' },
  { value: 'otros',        label: 'Otros' },
];

const ZONAS = ['Estepona', 'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga', 'Otra Costa del Sol'];

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

export function FichaAdminFormAnunciante({ anunciante }: { anunciante: Anunciante }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const desc = (anunciante.descripcion ?? {}) as { es?: string; en?: string };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await actualizarAnunciante(anunciante.id, formData);
    setLoading(false);
    if (result.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setStatus({ type: 'success', msg: 'Cambios guardados.' });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre del negocio */}
      <div>
        <label className={labelClass}>Nombre del negocio</label>
        <input name="nombre_negocio" type="text" defaultValue={anunciante.nombre_negocio}
          className={inputClass} style={inputStyle} required />
      </div>

      {/* Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Categoría</label>
          <select name="categoria" defaultValue={anunciante.categoria} className={inputClass} style={inputStyle}>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Plan</label>
          <select name="plan" defaultValue={anunciante.plan} className={inputClass} style={inputStyle}>
            <option value="basico">Básico — 29 €/mes</option>
            <option value="destacado">Destacado — 79 €/mes</option>
          </select>
        </div>
      </div>

      {/* Zona */}
      <div>
        <label className={labelClass}>Zona principal</label>
        <select name="zona" defaultValue={anunciante.zona ?? ''} className={inputClass} style={inputStyle}>
          <option value="">Sin zona específica</option>
          {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelClass}>URL del logo</label>
        <input name="logo_url" type="url" defaultValue={anunciante.logo_url ?? ''}
          placeholder="https://..." className={inputClass} style={inputStyle} />
      </div>

      {/* Descripción ES */}
      <div>
        <label className={labelClass}>Descripción (español)</label>
        <textarea name="descripcion_es" rows={3} defaultValue={desc.es ?? ''}
          placeholder="Descripción del negocio en español…"
          className={inputClass} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Descripción EN */}
      <div>
        <label className={labelClass}>Descripción (inglés)</label>
        <textarea name="descripcion_en" rows={3} defaultValue={desc.en ?? ''}
          placeholder="Business description in English…"
          className={inputClass} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Web */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Web</label>
          <input name="web" type="url" defaultValue={anunciante.web ?? ''}
            placeholder="https://negocio.com" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" defaultValue={anunciante.email ?? ''}
            placeholder="contacto@negocio.com" className={inputClass} style={inputStyle} />
        </div>
      </div>

      {/* Teléfono / WhatsApp */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Teléfono</label>
          <input name="telefono" type="tel" defaultValue={anunciante.telefono ?? ''}
            placeholder="+34 600 000 000" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input name="whatsapp" type="tel" defaultValue={anunciante.whatsapp ?? ''}
            placeholder="+34 600 000 000" className={inputClass} style={inputStyle} />
        </div>
      </div>

      {/* Activo */}
      <div className="flex items-center gap-3 pt-2">
        <input type="checkbox" name="activo" id="activo" defaultChecked={anunciante.activo}
          className="w-4 h-4 rounded" />
        <label htmlFor="activo" className="text-sm font-medium text-(--ink)">Anunciante activo (visible en el directorio)</label>
      </div>

      {/* Feedback */}
      {status && (
        <div className="rounded-lg px-4 py-3 text-sm border"
          style={{
            background: status.type === 'success' ? 'rgba(74,111,80,0.08)' : 'rgba(201,123,74,0.1)',
            borderColor: status.type === 'success' ? 'var(--green)' : 'var(--terra)',
            color: 'var(--ink)',
          }}>
          {status.msg}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.push('/admin/anunciantes')}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}>
          ← Volver
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
