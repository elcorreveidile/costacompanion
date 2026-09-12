'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { crearSolicitud } from '@/lib/solicitudes/actions';
import { localePath, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

interface Props {
  slug: string;
  locale: Locale;
  t: Dictionary['flujos'];
  modalidades: Dictionary['common']['modalidades'];
  acompananteId: string;
  nombrePublico: string;
}

export function SolicitarFormClient({ slug, locale, t, modalidades, acompananteId, nombrePublico }: Props) {
  const [fechaHoraDeseada, setFechaHoraDeseada] = useState<Date | null>(null);
  const today = new Date();
  const ts = t.solicitar;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href={localePath(locale, `/${slug}`)}
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.volverAlPerfil}
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            {ts.h1}
          </h1>
          <p className="text-(--ink)/60 mt-1">{t.con.replace('{nombre}', nombrePublico)}</p>
        </div>

        {/* Formulario */}
        <form action={crearSolicitud} className="space-y-6">
          <input type="hidden" name="acompanante_id" value={acompananteId} />
          <input
            type="hidden"
            name="fecha_hora_deseada"
            value={fechaHoraDeseada?.toISOString() ?? ''}
          />

          {/* Descripción (requerida) */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {ts.queNecesitas} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              required
              rows={4}
              placeholder={ts.queNecesitasPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone) resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* Fecha y hora deseada (opcional) */}
          <div>
            <p className="block text-sm font-medium text-(--ink) mb-1.5">
              {ts.fechaDeseada} <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
            </p>
            <DateTimePicker
              value={fechaHoraDeseada}
              onChange={setFechaHoraDeseada}
              minDate={today}
              placeholder={ts.fechaDeseadaPlaceholder}
            />
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {ts.modalidad} <span className="text-red-500">*</span>
            </label>
            <select
              name="modalidad"
              required
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="presencial">{modalidades.presencial}</option>
              <option value="remoto">{modalidades.remoto}</option>
              <option value="ambos">{modalidades.ambos}</option>
            </select>
          </div>

          {/* Zona */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {ts.zona}
            </label>
            <input
              type="text"
              name="zona"
              placeholder={ts.zonaPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* Detalle de servicio */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {ts.detalle} <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
            </label>
            <textarea
              name="detalle_servicio"
              rows={4}
              placeholder={ts.detallePlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone) resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <p className="text-xs text-(--ink)/40 mt-1.5">
              {ts.detalleNota}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            {ts.enviar}
          </button>
        </form>

        {/* Aviso de intermediación */}
        <p className="text-xs text-(--ink)/30 leading-relaxed mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
          {ts.aviso}
        </p>
      </div>
    </div>
  );
}
