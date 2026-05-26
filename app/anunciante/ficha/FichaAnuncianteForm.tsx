'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Anunciante } from '@/types/supabase';

const inputClass = 'w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };
const labelClass = 'block text-sm font-medium mb-1.5 text-(--ink)';

interface Props {
  anunciante: Pick<Anunciante, 'descripcion' | 'logo_url' | 'web' | 'telefono' | 'email' | 'whatsapp' | 'nombre_negocio' | 'categoria' | 'zona' | 'plan'>;
  action: (formData: FormData) => Promise<{ error?: string }>;
}

export function FichaAnuncianteForm({ anunciante, action }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const desc = (anunciante.descripcion ?? {}) as { es?: string; en?: string };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
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
      {/* Info de solo lectura */}
      <div className="rounded-lg p-4 text-sm space-y-1" style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}>
        <p className="font-medium text-(--ink)">{anunciante.nombre_negocio}</p>
        {anunciante.zona && <p className="text-(--ink)/60">{anunciante.zona}</p>}
        <p className="text-xs text-(--ink)/40">Nombre, categoría y zona son gestionados por el equipo de Costa Companion.</p>
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelClass}>URL del logo</label>
        <input name="logo_url" type="url" defaultValue={anunciante.logo_url ?? ''}
          placeholder="https://tu-web.com/logo.png" className={inputClass} style={inputStyle} />
        <p className="text-xs text-(--ink)/40 mt-1">Imagen cuadrada recomendada, mínimo 200×200 px.</p>
      </div>

      {/* Descripción ES */}
      <div>
        <label className={labelClass}>Descripción en español</label>
        <textarea name="descripcion_es" rows={4} defaultValue={desc.es ?? ''}
          placeholder="Describe tu negocio para los clientes hispanohablantes…"
          className={inputClass} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Descripción EN */}
      <div>
        <label className={labelClass}>Descripción en inglés</label>
        <textarea name="descripcion_en" rows={4} defaultValue={desc.en ?? ''}
          placeholder="Describe your business for English-speaking clients…"
          className={inputClass} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Web */}
      <div>
        <label className={labelClass}>Página web</label>
        <input name="web" type="url" defaultValue={anunciante.web ?? ''}
          placeholder="https://tu-negocio.com" className={inputClass} style={inputStyle} />
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email de contacto</label>
        <input name="email" type="email" defaultValue={anunciante.email ?? ''}
          placeholder="contacto@tu-negocio.com" className={inputClass} style={inputStyle} />
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
        <button type="button" onClick={() => router.push('/anunciante')}
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
