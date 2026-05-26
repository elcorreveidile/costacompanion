'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { crearSolicitud } from '@/lib/solicitudes/actions';

interface Props {
  slug: string;
  acompananteId: string;
  nombrePublico: string;
}

export function SolicitarFormClient({ slug, acompananteId, nombrePublico }: Props) {
  const [fechaHoraDeseada, setFechaHoraDeseada] = useState<Date | null>(null);
  const today = new Date();

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al perfil
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            Solicitud a medida
          </h1>
          <p className="text-(--ink)/60 mt-1">con {nombrePublico}</p>
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
              ¿Qué necesitas? <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              required
              rows={4}
              placeholder="Describe brevemente la gestión o servicio que necesitas…"
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone) resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* Fecha y hora deseada (opcional) */}
          <div>
            <p className="block text-sm font-medium text-(--ink) mb-1.5">
              Fecha y hora deseada <span className="text-(--ink)/40 font-normal">(opcional)</span>
            </p>
            <DateTimePicker
              value={fechaHoraDeseada}
              onChange={setFechaHoraDeseada}
              minDate={today}
              placeholder="Selecciona una fecha preferida (opcional)"
            />
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              Modalidad <span className="text-red-500">*</span>
            </label>
            <select
              name="modalidad"
              required
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>

          {/* Zona */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              Zona / Ubicación
            </label>
            <input
              type="text"
              name="zona"
              placeholder="p. ej. Marbella, Málaga centro…"
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone)"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* Detalle de servicio */}
          <div>
            <label className="block text-sm font-medium text-(--ink) mb-1.5">
              Detalle adicional <span className="text-(--ink)/40 font-normal">(opcional)</span>
            </label>
            <textarea
              name="detalle_servicio"
              rows={4}
              placeholder="Información adicional sobre tu situación…"
              className="w-full px-4 py-2.5 rounded-lg border text-sm bg-(--bone) resize-none"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <p className="text-xs text-(--ink)/40 mt-1.5">
              Opcional. No incluya datos que no desee compartir. Solo visible para el acompañante dentro de la plataforma.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--green)', color: 'var(--bone)' }}
          >
            Enviar solicitud
          </button>
        </form>

        {/* Aviso de intermediación */}
        <p className="text-xs text-(--ink)/30 leading-relaxed mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
          Costa Companion actúa exclusivamente como plataforma de intermediación.
          El acompañante revisará tu solicitud y te propondrá las condiciones del servicio.
          Los servicios son prestados directamente por los acompañantes, profesionales autónomos.
        </p>
      </div>
    </div>
  );
}
