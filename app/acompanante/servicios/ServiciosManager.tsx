'use client';

import { useState } from 'react';
import {
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  crearPaquete,
  eliminarPaquete,
} from '@/lib/acompanante/actions';
import type { Servicio, PaqueteClases, ServiceCategory } from '@/types/supabase';

interface ServicioConPaquetes extends Servicio {
  paquetes_clases: PaqueteClases[];
}

interface Props {
  servicios: ServicioConPaquetes[];
  categorias: ServiceCategory[];
  acompananteId: string;
}

const MODALIDADES = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Remoto', value: 'remoto' },
  { label: 'Ambos', value: 'ambos' },
];

const UNIDADES = [
  { label: 'Por hora', value: 'hora' },
  { label: 'Por servicio', value: 'servicio' },
  { label: 'Por sesión', value: 'sesion' },
];

function inputClass() {
  return 'w-full px-3 py-2 rounded-lg border text-sm outline-none';
}

const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };

function labelClass() {
  return 'block text-xs font-medium mb-1 text-(--ink)/70';
}

// ── Add Service Form ──────────────────────────────────────────────────────────

function AddServiceForm({
  categorias,
  onDone,
}: {
  categorias: ServiceCategory[];
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await crearServicio(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      (e.target as HTMLFormElement).reset();
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categoría */}
        <div>
          <label className={labelClass()}>Categoría *</label>
          <select name="categoria" required className={inputClass()} style={inputStyle}>
            <option value="">Seleccionar...</option>
            {categorias.map((cat) => {
              const nombre = (cat.nombre as { es?: string; en?: string }).es ?? cat.key;
              return (
                <option key={cat.id} value={cat.id}>
                  {nombre}
                </option>
              );
            })}
          </select>
        </div>

        {/* Modalidad */}
        <div>
          <label className={labelClass()}>Modalidad *</label>
          <select name="modalidad" required className={inputClass()} style={inputStyle}>
            {MODALIDADES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Título ES */}
        <div>
          <label className={labelClass()}>Título (Español) *</label>
          <input
            name="titulo_es"
            type="text"
            required
            className={inputClass()}
            style={inputStyle}
          />
        </div>

        {/* Título EN */}
        <div>
          <label className={labelClass()}>Title (English)</label>
          <input name="titulo_en" type="text" className={inputClass()} style={inputStyle} />
        </div>

        {/* Descripción ES */}
        <div>
          <label className={labelClass()}>Descripción (Español)</label>
          <textarea
            name="descripcion_es"
            rows={3}
            className={`${inputClass()} resize-y`}
            style={inputStyle}
          />
        </div>

        {/* Descripción EN */}
        <div>
          <label className={labelClass()}>Description (English)</label>
          <textarea
            name="descripcion_en"
            rows={3}
            className={`${inputClass()} resize-y`}
            style={inputStyle}
          />
        </div>

        {/* Precio */}
        <div>
          <label className={labelClass()}>Precio (€) *</label>
          <input
            name="precio"
            type="number"
            min={0}
            step={0.01}
            required
            className={inputClass()}
            style={inputStyle}
          />
        </div>

        {/* Unidad */}
        <div>
          <label className={labelClass()}>Unidad de precio</label>
          <select name="unidad_precio" className={inputClass()} style={inputStyle}>
            {UNIDADES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Es clase */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="es_clase"
          style={{ accentColor: 'var(--green)' }}
        />
        <span className="text-sm text-(--ink)">Es una clase (permite paquetes de sesiones)</span>
      </label>

      {error && (
        <p className="text-sm" style={{ color: 'var(--terra)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
        style={{ background: 'var(--green)', color: 'var(--bone)' }}
      >
        {loading ? 'Añadiendo...' : 'Añadir servicio'}
      </button>
    </form>
  );
}

// ── Package Form ──────────────────────────────────────────────────────────────

function AddPaqueteForm({
  servicioId,
  onDone,
}: {
  servicioId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('servicio_id', servicioId);
    const result = await crearPaquete(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      (e.target as HTMLFormElement).reset();
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 mt-3">
      <div className="flex-1">
        <label className={labelClass()}>Sesiones</label>
        <input
          name="num_sesiones"
          type="number"
          min={1}
          required
          defaultValue={5}
          className={inputClass()}
          style={inputStyle}
        />
      </div>
      <div className="flex-1">
        <label className={labelClass()}>Precio total (€)</label>
        <input
          name="precio_total"
          type="number"
          min={0}
          step={0.01}
          required
          className={inputClass()}
          style={inputStyle}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60 whitespace-nowrap"
        style={{ background: 'var(--green)', color: 'var(--bone)' }}
      >
        {loading ? '...' : 'Añadir'}
      </button>
      {error && <p className="text-xs text-(--terra) mt-1">{error}</p>}
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ServiciosManager({ servicios, categorias }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    setDeletingId(id);
    await eliminarServicio(id);
    setDeletingId(null);
  }

  async function handleDeletePaquete(id: string) {
    if (!confirm('¿Eliminar este paquete?')) return;
    await eliminarPaquete(id);
  }

  function getCategoryName(categoriaId: string): string {
    const cat = categorias.find((c) => c.id === categoriaId);
    if (!cat) return categoriaId;
    return (cat.nombre as { es?: string }).es ?? cat.key;
  }

  return (
    <div className="space-y-6">
      {/* Lista de servicios */}
      {servicios.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <p className="text-(--ink)/50">Aún no tienes servicios. Añade el primero.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servicios.map((servicio) => {
            const titulo = (servicio.titulo as { es?: string; en?: string }).es ?? 'Sin título';
            const descripcion = (servicio.descripcion as { es?: string } | null)?.es;

            return (
              <div
                key={servicio.id}
                className="rounded-xl border shadow-sm p-5"
                style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-(--ink)">{titulo}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bone)', color: 'var(--green)', border: '1px solid var(--line)' }}
                      >
                        {getCategoryName(servicio.categoria)}
                      </span>
                      {servicio.es_clase && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--terra-soft)', color: 'var(--terra)' }}
                        >
                          Clase
                        </span>
                      )}
                      {!servicio.activo && (
                        <span className="text-xs text-(--ink)/40">(Inactivo)</span>
                      )}
                    </div>
                    {descripcion && (
                      <p className="text-sm text-(--ink)/60 mt-1 truncate">{descripcion}</p>
                    )}
                    <p className="text-sm text-(--ink)/70 mt-1">
                      <span className="font-medium">{servicio.precio}€</span>
                      <span className="text-(--ink)/40"> / {servicio.unidad_precio}</span>
                      <span className="ml-2 text-(--ink)/40">{servicio.modalidad}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(servicio.id)}
                    disabled={deletingId === servicio.id}
                    className="shrink-0 text-sm text-(--terra) transition-opacity hover:opacity-70 disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </div>

                {/* Paquetes */}
                {servicio.es_clase && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                    <p className="text-xs font-medium text-(--ink)/50 mb-2">Paquetes de sesiones</p>

                    {servicio.paquetes_clases.length > 0 ? (
                      <div className="space-y-2">
                        {servicio.paquetes_clases.map((paq) => (
                          <div
                            key={paq.id}
                            className="flex items-center justify-between text-sm px-3 py-2 rounded-lg"
                            style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}
                          >
                            <span className="text-(--ink)">
                              {paq.num_sesiones} sesiones — <strong>{paq.precio_total}€</strong>
                            </span>
                            <button
                              onClick={() => handleDeletePaquete(paq.id)}
                              className="text-xs text-(--terra) transition-opacity hover:opacity-70"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-(--ink)/40">Sin paquetes</p>
                    )}

                    <AddPaqueteForm servicioId={servicio.id} onDone={() => {}} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Añadir servicio */}
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
          <span>+ Añadir nuevo servicio</span>
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
              <AddServiceForm
                categorias={categorias}
                onDone={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
