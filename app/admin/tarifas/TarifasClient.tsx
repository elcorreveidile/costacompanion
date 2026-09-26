'use client';

import { useState } from 'react';
import {
  guardarImporteTarifa,
  guardarRecargoZona,
  guardarConfigPrecio,
} from '@/lib/admin/tarifas';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

type TarifasDict = Dictionary['panelAdmin']['tarifas'];

interface TarifaRow {
  key: string;
  descripcion: Record<string, string>;
  importeCents: number;
  unidad: string;
}
interface ZonaRow {
  key: string;
  nombre: Record<string, string>;
  recargoCents: number;
}
interface ConfigRow {
  clave: string;
  valorEntero: number;
  descripcion: string | null;
}

interface Props {
  tarifas: TarifaRow[];
  zonas: ZonaRow[];
  config: ConfigRow[];
  t: TarifasDict;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2';
const inputStyle = {
  background: 'var(--bone)',
  borderColor: 'var(--line)',
  color: 'var(--ink)',
};

function Seccion({
  titulo,
  desc,
  children,
}: {
  titulo: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-medium text-(--green) mb-1">{titulo}</h2>
      <p className="text-sm text-(--ink)/50 mb-4">{desc}</p>
      <div
        className="rounded-xl border shadow-sm p-6 space-y-4"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        {children}
      </div>
    </section>
  );
}

function FilaImporte({
  etiqueta,
  secundaria,
  centsInicial,
  etiquetaImporte,
  etiquetaGuardar,
  etiquetaGuardado,
  etiquetaError,
  onGuardar,
}: {
  etiqueta: string;
  secundaria?: string;
  centsInicial: number;
  etiquetaImporte: string;
  etiquetaGuardar: string;
  etiquetaGuardado: string;
  etiquetaError: string;
  onGuardar: (cents: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [euros, setEuros] = useState((centsInicial / 100).toFixed(2));
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');

  async function guardar() {
    const cents = Math.round(parseFloat(euros.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setEstado('error');
      return;
    }
    setEstado('guardando');
    const res = await onGuardar(cents);
    setEstado(res.ok ? 'ok' : 'error');
    if (res.ok) setTimeout(() => setEstado('idle'), 2500);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1">
        <label className="block text-sm font-medium text-(--ink)">{etiqueta}</label>
        {secundaria && <p className="text-xs text-(--ink)/50">{secundaria}</p>}
      </div>
      <div className="flex items-end gap-2">
        <div className="w-32">
          <label className="block text-xs text-(--ink)/50 mb-1">{etiquetaImporte}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={euros}
            onChange={(e) => {
              setEuros(e.target.value);
              setEstado('idle');
            }}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <button
          type="button"
          onClick={guardar}
          disabled={estado === 'guardando'}
          className="px-4 py-2 bg-(--terra) hover:opacity-80 disabled:opacity-50 text-(--bone) text-sm font-medium rounded-md transition-opacity"
        >
          {estado === 'ok' ? etiquetaGuardado : estado === 'error' ? etiquetaError : etiquetaGuardar}
        </button>
      </div>
    </div>
  );
}

export function TarifasClient({ tarifas, zonas, config, t }: Props) {
  const nombre = (json: Record<string, string>, key: string) => json?.[key] ?? json?.es ?? key;

  return (
    <div>
      <Seccion titulo={t.tarifasTitulo} desc={t.tarifasDesc}>
        {tarifas.map((f) => (
          <FilaImporte
            key={f.key}
            etiqueta={nombre(f.descripcion, f.key)}
            secundaria={`modo: ${f.key} · ${f.unidad}`}
            centsInicial={f.importeCents}
            etiquetaImporte={t.importe}
            etiquetaGuardar={t.guardar}
            etiquetaGuardado={t.guardado}
            etiquetaError={t.error}
            onGuardar={(cents) => guardarImporteTarifa(f.key, cents)}
          />
        ))}
      </Seccion>

      <Seccion titulo={t.zonasTitulo} desc={t.zonasDesc}>
        {zonas.map((z) => (
          <FilaImporte
            key={z.key}
            etiqueta={nombre(z.nombre, z.key)}
            secundaria={`zona: ${z.key}`}
            centsInicial={z.recargoCents}
            etiquetaImporte={t.recargo}
            etiquetaGuardar={t.guardar}
            etiquetaGuardado={t.guardado}
            etiquetaError={t.error}
            onGuardar={(cents) => guardarRecargoZona(z.key, cents)}
          />
        ))}
      </Seccion>

      <Seccion titulo={t.configTitulo} desc={t.configDesc}>
        {config.map((c) => (
          <FilaImporte
            key={c.clave}
            etiqueta={c.descripcion ?? c.clave}
            secundaria={`clave: ${c.clave}`}
            centsInicial={c.valorEntero}
            etiquetaImporte={t.valor}
            etiquetaGuardar={t.guardar}
            etiquetaGuardado={t.guardado}
            etiquetaError={t.error}
            onGuardar={(valor) => guardarConfigPrecio(c.clave, valor)}
          />
        ))}
      </Seccion>
    </div>
  );
}
