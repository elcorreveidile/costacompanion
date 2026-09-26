'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { crearReservaGestion, previewPrecioGestion } from '@/lib/reservas/gestiones';
import type { DesglosePrecio, ModoGestion } from '@/lib/precios';
import { localePath, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

interface ZonaItem { key: string; nombre: string }
interface TipoGestionItem { key: string; nombre: string }

interface Props {
  slug: string;
  locale: Locale;
  t: Dictionary['flujos']['gestiones'];
  acompananteId: string;
  nombrePublico: string;
  modosDisponibles: ModoGestion[];
  efectivoBloqueado: boolean;
  zonas: ZonaItem[];
  tiposGestion: TipoGestionItem[];
  zonaBaseKey: string | null;
  idiomas: { code: string; nombre: string }[];
  precarga?: {
    modo: ModoGestion;
    tipoKey: string | null;
    idioma: string | null;
    zonaKey: string | null;
  } | null;
  /** true = petición en cola (Fase C1): sin acompañante, precio estimado. */
  modoCola?: boolean;
}

const HORAS_SELECTOR = [1, 2, 3, 4, 5, 6, 7, 8];

export function ReservarGestionForm({
  slug,
  locale,
  t,
  acompananteId,
  nombrePublico,
  modosDisponibles,
  efectivoBloqueado,
  zonas,
  tiposGestion,
  zonaBaseKey,
  idiomas,
  precarga,
  modoCola = false,
}: Props) {
  const [modo, setModo] = useState<ModoGestion | ''>(
    precarga?.modo ?? modosDisponibles[0] ?? ''
  );
  const [horas, setHoras] = useState(2);
  const [tipoKey, setTipoKey] = useState(precarga?.tipoKey ?? '');
  const [idioma, setIdioma] = useState(precarga?.idioma ?? '');
  const [zonaKey, setZonaKey] = useState(precarga?.zonaKey ?? '');
  const [fechaHora, setFechaHora] = useState<Date | null>(null);
  const [metodo, setMetodo] = useState<'tarjeta' | 'efectivo'>('tarjeta');

  const [desglose, setDesglose] = useState<DesglosePrecio | null>(null);
  const [aproximado, setAproximado] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);

  // En cola el preview es un estimado: se calcula SIN acompañante (recargo 0).
  const previewAcompId = modoCola ? null : acompananteId;

  const today = new Date();
  const presencial = modo !== '' && modo !== 'remota';
  const efectivoPosible = presencial && !efectivoBloqueado;

  // El modo manda: al cambiar a remota, el efectivo no aplica.
  useEffect(() => {
    if (!efectivoPosible && metodo === 'efectivo') setMetodo('tarjeta');
  }, [efectivoPosible, metodo]);

  // Preview de precio con debounce — SIEMPRE calculado en el servidor.
  const seq = useRef(0);
  useEffect(() => {
    if (!modo || !fechaHora) {
      setDesglose(null);
      setAproximado(false);
      setErrorCodigo(null);
      return;
    }
    const miSeq = ++seq.current;
    setCalculando(true);
    setErrorCodigo(null);
    const timer = setTimeout(async () => {
      try {
        const r = await previewPrecioGestion({
          acompananteId: previewAcompId,
          modo,
          horas: modo === 'horas' ? horas : undefined,
          zonaKey: modo === 'remota' ? null : zonaKey || null,
          fechaHoraISO: fechaHora.toISOString(),
        });
        if (seq.current !== miSeq) return;
        if (r.ok) {
          setDesglose(r.desglose);
          setAproximado(r.aproximado);
        } else {
          setDesglose(null);
          setAproximado(false);
          setErrorCodigo(r.codigo);
        }
      } catch {
        if (seq.current === miSeq) {
          setDesglose(null);
          setAproximado(false);
          setErrorCodigo('tarifa_no_configurada');
        }
      } finally {
        if (seq.current === miSeq) setCalculando(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [previewAcompId, modo, horas, zonaKey, fechaHora]);

  const eur = (cents: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const errorTexto: Record<string, string> = {
    zona_fuera_provincia: t.errorZona,
    fecha_invalida: t.errorFecha,
    horas_invalidas: t.errorHoras,
    modo_invalido: t.errorGenerico,
    acompanante_invalido: t.errorGenerico,
    tarifa_no_configurada: t.errorGenerico,
  };

  const puedeEnviar = !!modo && !!fechaHora && !!desglose && !calculando && !errorCodigo;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href={localePath(locale, modoCola ? '/' : `/${slug}`)}
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {modoCola ? t.colaVolver : t.volverAlPerfil}
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            {modoCola ? t.colaH1 : t.h1}
          </h1>
          <p className="text-(--ink)/60 mt-1">
            {modoCola ? t.colaSubtitulo : t.con.replace('{nombre}', nombrePublico)}
          </p>
        </div>

        {/* Conmutador gestión / clase (solo perfil de acompañante) */}
        {!modoCola && (
        <div className="flex gap-2 mb-8">
          <span
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            {t.tabGestion}
          </span>
          <Link
            href={localePath(locale, `/${slug}/reservar?tipo=clase`)}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-opacity hover:opacity-70"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            {t.tabClase}
          </Link>
        </div>
        )}

        <form action={crearReservaGestion} className="space-y-6">
          <input type="hidden" name="acompanante_id" value={modoCola ? '' : acompananteId} />
          <input type="hidden" name="modo" value={modo} />
          {modo === 'horas' && <input type="hidden" name="horas" value={horas} />}
          <input type="hidden" name="tipo_gestion_key" value={tipoKey} />
          <input type="hidden" name="idioma_gestion" value={idioma} />
          <input type="hidden" name="zona_key" value={presencial ? zonaKey : ''} />
          <input type="hidden" name="metodo_pago" value={metodo} />
          <input type="hidden" name="fecha_hora" value={fechaHora?.toISOString() ?? ''} />

          {/* Modo (duración y formato) */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {t.modoLabel} <span className="text-red-500">*</span>
            </label>
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value as ModoGestion | '')}
              required
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {modosDisponibles.includes('remota') && (
                <option value="remota">{t.modoRemota}</option>
              )}
              {modosDisponibles.includes('horas') && (
                <option value="horas">{t.modoHoras}</option>
              )}
              {modosDisponibles.includes('media_jornada') && (
                <option value="media_jornada">{t.modoMediaJornada}</option>
              )}
              {modosDisponibles.includes('jornada') && (
                <option value="jornada">{t.modoJornada}</option>
              )}
            </select>
          </div>

          {/* Horas (solo modo horas) */}
          {modo === 'horas' && (
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5">
                {t.horasLabel} <span className="text-red-500">*</span>
              </label>
              <select
                value={horas}
                onChange={(e) => setHoras(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {HORAS_SELECTOR.map((h) => (
                  <option key={h} value={h}>{h} h</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de gestión (opcional) */}
          {tiposGestion.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5">
                {t.tipoGestionLabel}{' '}
                <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
              </label>
              <select
                value={tipoKey}
                onChange={(e) => setTipoKey(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{t.sinTipo}</option>
                {tiposGestion.map((tg) => (
                  <option key={tg.key} value={tg.key}>{tg.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Idioma del acompañamiento (opcional) */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {t.idiomaLabel}{' '}
              <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="">{t.sinIdioma}</option>
              {idiomas.map((i) => (
                <option key={i.code} value={i.code}>{i.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div>
            <p className="block text-sm font-medium text-(--ink) mb-1.5">
              {t.fechaHora} <span className="text-red-500">*</span>
            </p>
            <DateTimePicker
              value={fechaHora}
              onChange={setFechaHora}
              minDate={today}
              placeholder={t.fechaHoraPlaceholder}
            />
          </div>

          {/* Municipio (solo presencial) */}
          {presencial && (
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5">
                {t.zonaLabel} <span className="text-red-500">*</span>
              </label>
              <select
                value={zonaKey}
                onChange={(e) => setZonaKey(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{t.zonaPlaceholder}</option>
                {zonas.map((z) => (
                  <option key={z.key} value={z.key}>
                    {z.nombre}
                    {z.key === zonaBaseKey ? ` · ${t.zonaBaseTag}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Método de pago */}
          <div>
            <p className="block text-sm font-medium text-(--ink) mb-1.5">
              {t.metodoPago} <span className="text-red-500">*</span>
            </p>
            <div className="space-y-2">
              <label
                className="flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-opacity hover:opacity-80"
                style={{ borderColor: metodo === 'tarjeta' ? 'var(--green)' : 'var(--line)' }}
              >
                <input
                  type="radio"
                  name="metodo_radio"
                  checked={metodo === 'tarjeta'}
                  onChange={() => setMetodo('tarjeta')}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-(--ink)">{t.tarjeta}</span>
                  <span className="block text-xs text-(--ink)/50 mt-0.5">{t.tarjetaNota}</span>
                </span>
              </label>
              {efectivoPosible && (
                <label
                  className="flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-opacity hover:opacity-80"
                  style={{ borderColor: metodo === 'efectivo' ? 'var(--green)' : 'var(--line)' }}
                >
                  <input
                    type="radio"
                    name="metodo_radio"
                    checked={metodo === 'efectivo'}
                    onChange={() => setMetodo('efectivo')}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-(--ink)">{t.efectivo}</span>
                    <span className="block text-xs text-(--ink)/50 mt-0.5">{t.efectivoNota}</span>
                  </span>
                </label>
              )}
              {efectivoBloqueado && (
                <p className="text-xs text-(--ink)/40 px-1">{t.efectivoBloqueadoNota}</p>
              )}
            </div>
          </div>

          {/* Detalle adicional */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {t.detalle} <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
            </label>
            <textarea
              name="detalle_servicio"
              rows={4}
              placeholder={t.detallePlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone) resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <p className="text-xs text-(--ink)/40 mt-1.5">{t.detalleNota}</p>
          </div>

          {/* Desglose del precio (siempre visible antes de confirmar) */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--line)', background: 'var(--bone-2)' }}
          >
            <p className="font-display text-sm font-semibold text-(--green) mb-3">
              {modoCola ? t.colaDesgloseTitulo : t.desgloseTitulo}
            </p>
            {calculando && !desglose && (
              <p className="text-sm text-(--ink)/50">{t.calculando}</p>
            )}
            {errorCodigo && (
              <p className="text-sm text-red-600">{errorTexto[errorCodigo] ?? t.errorGenerico}</p>
            )}
            {!calculando && !errorCodigo && !fechaHora && (
              <p className="text-sm text-(--ink)/40">{t.desglosePendiente}</p>
            )}
            {desglose && !errorCodigo && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-(--ink)/70">
                    {t.lineaBase}
                    {desglose.horasFacturadas ? ` · ${desglose.horasFacturadas} h` : ''}
                  </span>
                  <span className="text-(--ink)">{eur(desglose.baseCents)}</span>
                </div>
                {desglose.recargoZonaCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-(--ink)/70">{t.lineaZona}</span>
                    <span className="text-(--ink)">{eur(desglose.recargoZonaCents)}</span>
                  </div>
                )}
                {desglose.recargoUrgenciaCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-(--ink)/70">{t.lineaUrgencia}</span>
                    <span className="text-(--ink)">{eur(desglose.recargoUrgenciaCents)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between border-t pt-2 mt-2 text-sm font-semibold"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span className="text-(--ink)">{t.total}</span>
                  <span className="text-(--green)">{eur(desglose.totalCents)}</span>
                </div>
                {desglose.urgencia && (
                  <p className="text-xs text-(--ink)/50 pt-1">{t.urgenciaAviso}</p>
                )}
                {modoCola && (
                  <p className="text-xs text-(--ink)/50 pt-1">{t.colaEstimadoNota}</p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!puedeEnviar}
            className="w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            {modoCola ? t.colaEnviar : t.enviar}
          </button>
        </form>

        {/* Aviso de intermediación */}
        <p
          className="text-xs text-(--ink)/30 leading-relaxed mt-8 pt-6 border-t"
          style={{ borderColor: 'var(--line)' }}
        >
          {modoCola ? t.colaAviso : t.aviso}
        </p>
      </div>
    </div>
  );
}
