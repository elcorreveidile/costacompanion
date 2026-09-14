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
import type { Dictionary } from '@/lib/i18n/dictionaries/es';
import { pickLang } from '@/lib/i18n/pick';
import type { Locale } from '@/lib/i18n/config';

type ServiciosDict = Dictionary['panelAcompanante']['servicios'];
type Modalidades = Dictionary['common']['modalidades'];

interface ServicioConPaquetes extends Servicio {
  paquetes_clases: PaqueteClases[];
}

interface Props {
  servicios: ServicioConPaquetes[];
  categorias: ServiceCategory[];
  acompananteId: string;
  t: ServiciosDict;
  modalidades: Modalidades;
  eliminar: string;
  editar: string;
  guardar: string;
  guardando: string;
  cancelar: string;
  locale: Locale;
}

function inputClass() {
  return 'w-full px-3 py-2 rounded-lg border text-sm outline-none';
}

const inputStyle = { background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' };

function labelClass() {
  return 'block text-xs font-medium mb-1 text-(--ink)/70';
}

// ── Service Form (crear y editar) ─────────────────────────────────────────────

function ServiceForm({
  categorias,
  onDone,
  onCancel,
  t,
  modalidades,
  locale,
  labels,
  servicio,
}: {
  categorias: ServiceCategory[];
  onDone: () => void;
  onCancel?: () => void;
  t: ServiciosDict;
  modalidades: Modalidades;
  locale: Locale;
  labels: { guardar: string; guardando: string; cancelar: string };
  servicio?: ServicioConPaquetes;
}) {
  const editing = !!servicio;
  const titulo = (servicio?.titulo ?? {}) as { es?: string; en?: string };
  const descripcion = (servicio?.descripcion ?? {}) as { es?: string; en?: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MODALIDADES: { label: string; value: string }[] = [
    { label: modalidades.presencial, value: 'presencial' },
    { label: modalidades.remoto, value: 'remoto' },
    { label: modalidades.ambos, value: 'ambos' },
  ];

  const UNIDADES: { label: string; value: string }[] = [
    { label: t.unidades.hora, value: 'hora' },
    { label: t.unidades.servicio, value: 'servicio' },
    { label: t.unidades.sesion, value: 'sesion' },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = editing
      ? await actualizarServicio(servicio!.id, formData)
      : await crearServicio(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      if (!editing) (e.target as HTMLFormElement).reset();
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categoría */}
        <div>
          <label className={labelClass()}>{t.categoria}</label>
          <select
            name="categoria"
            required
            defaultValue={servicio?.categoria ?? ''}
            className={inputClass()}
            style={inputStyle}
          >
            <option value="">{t.seleccionar}</option>
            {categorias.map((cat) => {
              const nombre = pickLang(cat.nombre as Record<string, unknown>, locale) || cat.key;
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
          <label className={labelClass()}>{t.modalidad}</label>
          <select
            name="modalidad"
            required
            defaultValue={servicio?.modalidad ?? 'presencial'}
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

        {/* Título ES */}
        <div>
          <label className={labelClass()}>{t.tituloEs}</label>
          <input
            name="titulo_es"
            type="text"
            required
            defaultValue={titulo.es ?? ''}
            className={inputClass()}
            style={inputStyle}
          />
        </div>

        {/* Título EN */}
        <div>
          <label className={labelClass()}>{t.tituloEn}</label>
          <input
            name="titulo_en"
            type="text"
            defaultValue={titulo.en ?? ''}
            className={inputClass()}
            style={inputStyle}
          />
        </div>

        {/* Descripción ES */}
        <div>
          <label className={labelClass()}>{t.descripcionEs}</label>
          <textarea
            name="descripcion_es"
            rows={3}
            defaultValue={descripcion.es ?? ''}
            className={`${inputClass()} resize-y`}
            style={inputStyle}
          />
        </div>

        {/* Descripción EN */}
        <div>
          <label className={labelClass()}>{t.descripcionEn}</label>
          <textarea
            name="descripcion_en"
            rows={3}
            defaultValue={descripcion.en ?? ''}
            className={`${inputClass()} resize-y`}
            style={inputStyle}
          />
        </div>

        {/* Precio */}
        <div>
          <label className={labelClass()}>{t.precio}</label>
          <input
            name="precio"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={servicio?.precio ?? ''}
            className={inputClass()}
            style={inputStyle}
          />
        </div>

        {/* Unidad */}
        <div>
          <label className={labelClass()}>{t.unidadPrecio}</label>
          <select
            name="unidad_precio"
            defaultValue={servicio?.unidad_precio ?? 'hora'}
            className={inputClass()}
            style={inputStyle}
          >
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
          defaultChecked={servicio?.es_clase ?? false}
          style={{ accentColor: 'var(--green)' }}
        />
        <span className="text-sm text-(--ink)">{t.esClase}</span>
      </label>

      {error && (
        <p className="text-sm" style={{ color: 'var(--terra)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          {loading ? (editing ? labels.guardando : t.anadiendo) : editing ? labels.guardar : t.anadirServicio}
        </button>
        {editing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
            style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1px solid var(--line)' }}
          >
            {labels.cancelar}
          </button>
        )}
      </div>
    </form>
  );
}

// ── Package Form ──────────────────────────────────────────────────────────────

function AddPaqueteForm({
  servicioId,
  onDone,
  t,
}: {
  servicioId: string;
  onDone: () => void;
  t: ServiciosDict;
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
        <label className={labelClass()}>{t.sesionesLabel}</label>
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
        <label className={labelClass()}>{t.precioTotal}</label>
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
        {loading ? '...' : t.anadir}
      </button>
      {error && <p className="text-xs text-(--terra) mt-1">{error}</p>}
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ServiciosManager({
  servicios,
  categorias,
  t,
  modalidades,
  eliminar,
  editar,
  guardar,
  guardando,
  cancelar,
  locale,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formLabels = { guardar, guardando, cancelar };

  async function handleDelete(id: string) {
    if (!confirm(t.confirmEliminarServicio)) return;
    setDeleteError(null);
    setDeletingId(id);
    const res = await eliminarServicio(id);
    setDeletingId(null);
    if (res?.error) setDeleteError(res.error);
  }

  async function handleDeletePaquete(id: string) {
    if (!confirm(t.confirmEliminarPaquete)) return;
    await eliminarPaquete(id);
  }

  function getCategoryName(categoriaId: string): string {
    const cat = categorias.find((c) => c.id === categoriaId);
    if (!cat) return categoriaId;
    return pickLang(cat.nombre as Record<string, unknown>, locale) || cat.key;
  }

  function modalidadLabel(modalidad: string): string {
    return (modalidades as Record<string, string>)[modalidad] ?? modalidad;
  }

  function unidadLabel(unidad: string): string {
    return (t.unidadesCorto as Record<string, string>)[unidad] ?? unidad;
  }

  return (
    <div className="space-y-6">
      {deleteError && (
        <p
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(201,123,74,0.10)', color: 'var(--terra)' }}
        >
          {deleteError}
        </p>
      )}

      {/* Lista de servicios */}
      {servicios.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <p className="text-(--ink)/50">{t.vacio}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servicios.map((servicio) => {
            const titulo = pickLang(servicio.titulo as Record<string, unknown>, locale) || t.sinTitulo;
            const descripcion = pickLang(servicio.descripcion as Record<string, unknown> | null, locale);
            const isEditing = editingId === servicio.id;

            return (
              <div
                key={servicio.id}
                className="rounded-xl border shadow-sm p-5"
                style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
              >
                {isEditing ? (
                  <ServiceForm
                    categorias={categorias}
                    servicio={servicio}
                    onDone={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                    t={t}
                    modalidades={modalidades}
                    locale={locale}
                    labels={formLabels}
                  />
                ) : (
                  <>
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
                              {t.claseBadge}
                            </span>
                          )}
                          {!servicio.activo && (
                            <span className="text-xs text-(--ink)/40">{t.inactivo}</span>
                          )}
                        </div>
                        {descripcion && (
                          <p className="text-sm text-(--ink)/60 mt-1 truncate">{descripcion}</p>
                        )}
                        <p className="text-sm text-(--ink)/70 mt-1">
                          <span className="font-medium">{servicio.precio}€</span>
                          <span className="text-(--ink)/40"> / {unidadLabel(servicio.unidad_precio)}</span>
                          <span className="ml-2 text-(--ink)/40">{modalidadLabel(servicio.modalidad)}</span>
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setEditingId(servicio.id);
                          }}
                          className="text-sm text-(--green) transition-opacity hover:opacity-70"
                        >
                          {editar}
                        </button>
                        <button
                          onClick={() => handleDelete(servicio.id)}
                          disabled={deletingId === servicio.id}
                          className="text-sm text-(--terra) transition-opacity hover:opacity-70 disabled:opacity-40"
                        >
                          {eliminar}
                        </button>
                      </div>
                    </div>

                    {/* Paquetes */}
                    {servicio.es_clase && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                        <p className="text-xs font-medium text-(--ink)/50 mb-2">{t.paquetesTitulo}</p>

                        {servicio.paquetes_clases.length > 0 ? (
                          <div className="space-y-2">
                            {servicio.paquetes_clases.map((paq) => (
                              <div
                                key={paq.id}
                                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg"
                                style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}
                              >
                                <span className="text-(--ink)">
                                  {paq.num_sesiones} {t.sesiones} — <strong>{paq.precio_total}€</strong>
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
                          <p className="text-xs text-(--ink)/40">{t.sinPaquetes}</p>
                        )}

                        <AddPaqueteForm servicioId={servicio.id} onDone={() => {}} t={t} />
                      </div>
                    )}
                  </>
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
          <span>{t.anadirNuevoServicio}</span>
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
              <ServiceForm
                categorias={categorias}
                onDone={() => setShowAddForm(false)}
                t={t}
                modalidades={modalidades}
                locale={locale}
                labels={formLabels}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
