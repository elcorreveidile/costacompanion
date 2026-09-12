'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { crearReserva } from '@/lib/reservas/actions';
import type { Modalidad } from '@/types/supabase';
import { localePath, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

interface ServicioItem {
  id: string;
  titulo: string;
  precio: number;
  unidad_precio: string;
}

interface DisponibilidadItem {
  id: string;
  fecha_hora: string;
  duracion_min: number;
  modalidad: Modalidad;
  zona: string | null;
}

interface Props {
  slug: string;
  locale: Locale;
  t: Dictionary['flujos'];
  modalidades: Dictionary['common']['modalidades'];
  acompananteId: string;
  nombrePublico: string;
  servicios: ServicioItem[];
  disponibilidades: DisponibilidadItem[];
}

export function ReservarFormClient({
  slug,
  locale,
  t,
  modalidades,
  acompananteId,
  nombrePublico,
  servicios,
  disponibilidades,
}: Props) {
  const [fechaHora, setFechaHora] = useState<Date | null>(null);
  const today = new Date();
  const tr = t.reservar;

  function formatDisponibilidad(d: DisponibilidadItem): string {
    const fecha = new Date(d.fecha_hora);
    const fechaStr = fecha.toLocaleDateString(locale, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    const horaStr = fecha.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const durH = Math.floor(d.duracion_min / 60);
    const durM = d.duracion_min % 60;
    const durStr = durH > 0
      ? `${durH}h${durM > 0 ? ` ${durM}min` : ''}`
      : `${durM}min`;
    const zonaStr = d.zona ? ` · ${d.zona}` : '';
    const modLabel = modalidades[d.modalidad as keyof typeof modalidades] ?? d.modalidad;
    return `${fechaStr} ${tr.aLas} ${horaStr} (${durStr}) · ${modLabel}${zonaStr}`;
  }

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
            {tr.h1}
          </h1>
          <p className="text-(--ink)/60 mt-1">{t.con.replace('{nombre}', nombrePublico)}</p>
        </div>

        {/* Formulario */}
        <form action={crearReserva} className="space-y-6">
          <input type="hidden" name="acompanante_id" value={acompananteId} />
          <input
            type="hidden"
            name="fecha_hora"
            value={fechaHora?.toISOString() ?? ''}
          />

          {/* Servicio (opcional) */}
          {servicios.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5">
                {tr.servicio} <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
              </label>
              <select
                name="servicio_id"
                className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{tr.sinServicio}</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titulo} — {s.precio}€/{s.unidad_precio}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Franja de disponibilidad (opcional) */}
          {disponibilidades.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5">
                {tr.franja} <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
              </label>
              <select
                name="disponibilidad_id"
                className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="">{tr.sinFranja}</option>
                {disponibilidades.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDisponibilidad(d)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fecha y hora */}
          <div>
            <p className="block text-sm font-medium text-(--ink) mb-1.5">
              {tr.fechaHora} <span className="text-red-500">*</span>
            </p>
            <DateTimePicker
              value={fechaHora}
              onChange={setFechaHora}
              minDate={today}
              placeholder={tr.fechaHoraPlaceholder}
            />
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {tr.modalidad} <span className="text-red-500">*</span>
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
              {tr.zona}
            </label>
            <input
              type="text"
              name="zona"
              placeholder={tr.zonaPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* Detalle de servicio */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              {tr.detalle} <span className="text-(--ink)/40 font-normal">{t.opcional}</span>
            </label>
            <textarea
              name="detalle_servicio"
              rows={4}
              placeholder={tr.detallePlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone) resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <p className="text-xs text-(--ink)/40 mt-1.5">
              {tr.detalleNota}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            {tr.enviar}
          </button>
        </form>

        {/* Aviso de intermediación */}
        <p className="text-xs text-(--ink)/30 leading-relaxed mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
          {tr.aviso}
        </p>
      </div>
    </div>
  );
}
