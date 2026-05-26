'use client';

import { useState } from 'react';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { crearDisponibilidad, eliminarDisponibilidad } from '@/lib/acompanante/actions';
import type { Disponibilidad } from '@/types/supabase';

const DURACIONES = [
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1h 30min', value: 90 },
  { label: '2 horas', value: 120 },
];

const MODALIDADES = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Remoto', value: 'remoto' },
  { label: 'Ambos', value: 'ambos' },
];

function formatFechaHora(fechaHora: string): string {
  const d = new Date(fechaHora);
  return d.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function inputClass() {
  return 'w-full px-3 py-2 rounded-lg border text-sm outline-none';
}

const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };

function labelClass() {
  return 'block text-xs font-medium mb-1 text-(--ink)/70';
}

// ── Add Form ──────────────────────────────────────────────────────────────────

function AddFranjaForm({ onDone }: { onDone: () => void }) {
  const [fechaHora, setFechaHora] = useState<Date | null>(null);
  const [duracion, setDuracion] = useState(60);
  const [modalidad, setModalidad] = useState('presencial');
  const [zona, setZona] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fechaHora) {
      setError('Selecciona una fecha y hora.');
      return;
    }

    setError(null);
    setLoading(true);

    const result = await crearDisponibilidad({
      fechaHora: fechaHora.toISOString(),
      duracionMin: duracion,
      modalidad,
      zona,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setFechaHora(null);
      setZona('');
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha y hora */}
        <div className="md:col-span-2">
          <DateTimePicker
            label="Fecha y hora *"
            value={fechaHora}
            onChange={setFechaHora}
            minDate={today}
            locale="es"
          />
        </div>

        {/* Duración */}
        <div>
          <label className={labelClass()}>Duración</label>
          <select
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className={inputClass()}
            style={inputStyle}
          >
            {DURACIONES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Modalidad */}
        <div>
          <label className={labelClass()}>Modalidad</label>
          <select
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            className={inputClass()}
            style={inputStyle}
          >
            {MODALIDADES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Zona */}
        <div className="md:col-span-2">
          <label className={labelClass()}>Zona (opcional)</label>
          <input
            type="text"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            placeholder="Ej: Marbella centro"
            className={inputClass()}
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--terra)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !fechaHora}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: 'var(--green)', color: 'var(--bone)' }}
      >
        {loading ? 'Añadiendo...' : 'Añadir franja'}
      </button>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DisponibilidadManager({ franjas }: { franjas: Disponibilidad[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta franja horaria?')) return;
    setDeletingId(id);
    await eliminarDisponibilidad(id);
    setDeletingId(null);
  }

  // Separar futuras y pasadas
  const now = new Date();
  const futuras = franjas.filter((f) => new Date(f.fecha_hora) >= now);
  const pasadas = franjas.filter((f) => new Date(f.fecha_hora) < now);

  return (
    <div className="space-y-6">
      {/* Franjas futuras */}
      <div
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="px-6 py-4" style={{ background: 'var(--bone-2)' }}>
          <h2 className="font-medium text-(--green)">Próximas franjas</h2>
        </div>

        {futuras.length === 0 ? (
          <div className="px-6 py-8 text-center" style={{ background: 'var(--bone)' }}>
            <p className="text-(--ink)/50 text-sm">
              No tienes franjas horarias publicadas. Añade una.
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--bone)' }}>
            {futuras.map((franja, i) => (
              <div
                key={franja.id}
                className="flex items-center justify-between px-6 py-4 gap-4"
                style={{
                  borderTop: i > 0 ? '1px solid var(--line)' : undefined,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-(--ink) text-sm">
                    {formatFechaHora(franja.fecha_hora)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-(--ink)/50">{franja.duracion_min} min</span>
                    <span className="text-xs text-(--ink)/50">·</span>
                    <span className="text-xs text-(--ink)/50">{franja.modalidad}</span>
                    {franja.zona && (
                      <>
                        <span className="text-xs text-(--ink)/50">·</span>
                        <span className="text-xs text-(--ink)/50">{franja.zona}</span>
                      </>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: franja.estado === 'abierto' ? 'var(--bone-2)' : 'var(--terra-soft)',
                        color: franja.estado === 'abierto' ? 'var(--green)' : 'var(--terra)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {franja.estado}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(franja.id)}
                  disabled={deletingId === franja.id}
                  className="text-sm text-(--terra) transition-opacity hover:opacity-70 disabled:opacity-40 shrink-0"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario añadir */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--green)' }}
        >
          <span>+ Añadir franja horaria</span>
          <svg
            className="w-4 h-4 transition-transform"
            style={{ transform: showAddForm ? 'rotate(180deg)' : undefined }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAddForm && (
          <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="pt-4">
              <AddFranjaForm onDone={() => setShowAddForm(false)} />
            </div>
          </div>
        )}
      </div>

      {/* Historial */}
      {pasadas.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-(--ink)/40 hover:text-(--ink)/60 transition-colors list-none flex items-center gap-2">
            <span>Ver historial ({pasadas.length} franjas pasadas)</span>
          </summary>
          <div
            className="mt-3 rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--line)' }}
          >
            {pasadas.map((franja, i) => (
              <div
                key={franja.id}
                className="flex items-center justify-between px-6 py-3 gap-4 opacity-50"
                style={{
                  background: 'var(--bone-2)',
                  borderTop: i > 0 ? '1px solid var(--line)' : undefined,
                }}
              >
                <p className="text-sm text-(--ink)">
                  {formatFechaHora(franja.fecha_hora)} · {franja.duracion_min} min · {franja.modalidad}
                  {franja.zona ? ` · ${franja.zona}` : ''}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
