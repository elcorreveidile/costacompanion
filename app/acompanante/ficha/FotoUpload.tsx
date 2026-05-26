'use client';

import { useState, useRef } from 'react';
import { subirFotoAcompanante } from '@/lib/acompanante/actions';

interface FotoUploadProps {
  initialUrl?: string | null;
  onUrlChange: (url: string) => void;
}

export function FotoUpload({ initialUrl, onUrlChange }: FotoUploadProps) {
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
    const result = await subirFotoAcompanante(fd);

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
          <img src={preview} alt="Foto de perfil" className="w-full h-full object-cover" />
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
          {uploading ? 'Subiendo…' : preview ? 'Cambiar foto' : 'Subir foto'}
        </button>
        <p className="text-xs" style={{ color: 'var(--ink)', opacity: 0.4 }}>
          JPG, PNG o WEBP · Máx. 5 MB
        </p>
        {uploadError && (
          <p className="text-xs" style={{ color: 'var(--terra)' }}>{uploadError}</p>
        )}
      </div>
    </div>
  );
}
