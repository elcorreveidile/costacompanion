'use client';

import { useState, useRef } from 'react';
import { subirFotoAcompanante } from '@/lib/acompanante/actions';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

type FotoDict = Dictionary['panelAcompanante']['ficha']['foto'];

// Fallback en español para usos sin i18n (p. ej. el panel de admin).
const FOTO_DEFAULT_ES: FotoDict = {
  subiendo: 'Subiendo…',
  cambiar: 'Cambiar foto',
  subir: 'Subir foto',
  alt: 'Foto de perfil',
  ayuda: 'JPG, PNG o WEBP. Máximo 5 MB.',
};

interface FotoUploadProps {
  initialUrl?: string | null;
  onUrlChange: (url: string) => void;
  t?: FotoDict;
  /** Acción de subida a usar. Por defecto, la del propio acompañante. */
  uploadAction?: (fd: FormData) => Promise<{ url?: string; error?: string }>;
  /** Campos extra a adjuntar al FormData (p. ej. acompanante_id en admin). */
  extraFields?: Record<string, string>;
}

export function FotoUpload({ initialUrl, onUrlChange, t, uploadAction, extraFields }: FotoUploadProps) {
  const labels = t ?? FOTO_DEFAULT_ES;
  const doUpload = uploadAction ?? subirFotoAcompanante;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setUploadError(null);

    const fd = new FormData();
    fd.append('foto', file);
    for (const [k, v] of Object.entries(extraFields ?? {})) fd.append(k, v);
    const result = await doUpload(fd);

    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
      setPreview(initialUrl ?? null);
    } else if (result.url) {
      setPreview(result.url);
      onUrlChange(result.url);
    }

    if (inputRef.current) inputRef.current.value = '';
    URL.revokeObjectURL(localUrl);
  }

  return (
    <div className="flex items-start gap-4">
      {/* Preview */}
      <div
        className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border"
        style={{ background: 'var(--bone)', borderColor: 'var(--line)' }}
      >
        {preview ? (
          <img src={preview} alt={labels.alt} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'var(--ink)', opacity: 0.2 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'var(--bone)' }}
        >
          {uploading ? labels.subiendo : preview ? labels.cambiar : labels.subir}
        </button>
        <p className="text-xs" style={{ color: 'var(--ink)', opacity: 0.4 }}>
          {labels.ayuda}
        </p>
        {uploadError && (
          <p className="text-xs" style={{ color: 'var(--terra)' }}>{uploadError}</p>
        )}
      </div>
    </div>
  );
}
