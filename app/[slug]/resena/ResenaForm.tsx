'use client';

import { useState } from 'react';
import Link from 'next/link';
import { crearResena } from '@/lib/resenas/actions';
import { localePath, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

interface ResenaFormProps {
  reservaId: string;
  acompananteId: string;
  slug: string;
  locale: Locale;
  t: Dictionary['flujos'];
  acompananteNombre: string;
}

function Estrella({ filled, hovered, onClick, onEnter, onLeave }: {
  filled: boolean;
  hovered: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const active = filled || hovered;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="transition-transform hover:scale-110 focus:outline-none"
      aria-label="Puntuación"
    >
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill={active ? 'var(--terra)' : 'none'}
        stroke="var(--terra)"
        strokeWidth={1.5}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

export default function ResenaForm({ reservaId, acompananteId: _acompananteId, slug, locale, t, acompananteNombre }: ResenaFormProps) {
  const tr = t.resena;
  const LABELS = tr.labels;
  const [puntuacion, setPuntuacion] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (puntuacion === 0) { setError(tr.seleccionaPuntuacion); return; }

    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    fd.set('reserva_id', reservaId);
    fd.set('puntuacion', String(puntuacion));

    const result = await crearResena(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setEnviado(true);
    }
  }

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <Link href={localePath(locale, `/${slug}`)} className="hover:text-(--ink) transition-colors">
            {acompananteNombre || tr.perfil}
          </Link>
          <span>›</span>
          <span className="text-(--ink)/80">{tr.breadcrumb}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          {tr.h1}
        </h1>
        <p className="text-(--ink)/60 mb-8">
          {acompananteNombre
            ? tr.subtituloCon.replace('{nombre}', acompananteNombre)
            : tr.subtituloSin}
        </p>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          {enviado ? (
            <div className="text-center py-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--green)' }}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-medium text-(--green) mb-2">
                {tr.okTitulo}
              </h2>
              <p className="text-(--ink)/60 mb-6">
                {tr.okTexto}
              </p>
              <Link
                href={localePath(locale, `/${slug}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                {t.volverAlPerfil}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Estrellas */}
              <div>
                <label className="block text-sm font-medium mb-3 text-(--ink)">
                  {tr.puntuacion} <span style={{ color: 'var(--terra)' }}>*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Estrella
                      key={star}
                      filled={star <= puntuacion}
                      hovered={star <= hovered && hovered > 0}
                      onClick={() => setPuntuacion(star)}
                      onEnter={() => setHovered(star)}
                      onLeave={() => setHovered(0)}
                    />
                  ))}
                  {(hovered > 0 || puntuacion > 0) && (
                    <span className="ml-3 text-sm font-medium" style={{ color: 'var(--terra)' }}>
                      {LABELS[hovered || puntuacion]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comentario */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-(--ink)">
                  {tr.comentario} <span className="font-normal text-(--ink)/40">{t.opcional}</span>
                </label>
                <textarea
                  name="comentario"
                  rows={4}
                  placeholder={tr.comentarioPlaceholder}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 resize-y"
                  style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm border"
                  style={{ background: 'rgba(201,123,74,0.1)', borderColor: 'var(--terra)', color: 'var(--ink)' }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Link
                  href={localePath(locale, `/${slug}`)}
                  className="flex-1 py-3 rounded-lg text-sm font-medium border text-center transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {tr.cancelar}
                </Link>
                <button
                  type="submit"
                  disabled={loading || puntuacion === 0}
                  className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'var(--green)', color: 'var(--bone)' }}
                >
                  {loading ? tr.enviando : tr.publicar}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
