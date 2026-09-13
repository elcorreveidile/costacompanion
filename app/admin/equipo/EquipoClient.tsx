'use client';

import { useState } from 'react';
import { resetPinSuperadmin } from '@/lib/admin/acompanantes';

interface Superadmin {
  id: string;
  nombre: string | null;
  email: string | null;
  numeroUsuario: string | null;
  tienePin: boolean;
}

interface Labels {
  thNombre: string;
  thEmail: string;
  thEstadoPin: string;
  conPin: string;
  sinPin: string;
  confirmReset: string;
  reiniciarPin: string;
  reiniciando: string;
  pinNuevo: string;
  apunta: string;
  numeroUsuario: string;
  anonimo: string;
}

export function EquipoClient({
  superadmins,
  labels,
}: {
  superadmins: Superadmin[];
  labels: Labels;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creds, setCreds] = useState<Record<string, { numeroUsuario?: string; pin?: string }>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleReset(id: string) {
    if (!confirm(labels.confirmReset)) return;
    setError(null);
    setLoadingId(id);
    const res = await resetPinSuperadmin(id);
    setLoadingId(null);
    if (res.error) setError(res.error);
    else setCreds((c) => ({ ...c, [id]: { numeroUsuario: res.numeroUsuario, pin: res.pin } }));
  }

  return (
    <div className="rounded-xl border shadow-sm overflow-x-auto" style={{ borderColor: 'var(--line)' }}>
      {error && (
        <p className="px-4 py-3 text-sm" style={{ color: '#b43c32' }}>{error}</p>
      )}
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr style={{ background: 'var(--bone-2)', borderBottom: '1px solid var(--line)' }}>
            <th className="text-left px-4 py-3 font-medium text-(--ink)/60">{labels.thNombre}</th>
            <th className="text-left px-4 py-3 font-medium text-(--ink)/60">{labels.thEmail}</th>
            <th className="text-left px-4 py-3 font-medium text-(--ink)/60">{labels.thEstadoPin}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {superadmins.map((s, idx) => {
            const c = creds[s.id];
            return (
              <tr
                key={s.id}
                style={{
                  background: idx % 2 === 0 ? 'var(--bone)' : 'var(--bone-2)',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <td className="px-4 py-3 font-medium text-(--ink)">{s.nombre || labels.anonimo}</td>
                <td className="px-4 py-3 text-(--ink)/70">{s.email || labels.anonimo}</td>
                <td className="px-4 py-3">
                  {c ? (
                    <div className="text-xs">
                      <span className="text-(--ink)/50">{labels.numeroUsuario}: </span>
                      <span className="font-mono font-semibold tracking-widest text-(--ink)">{c.numeroUsuario}</span>
                      <span className="text-(--ink)/50"> · {labels.pinNuevo}: </span>
                      <span className="font-mono font-semibold tracking-widest text-(--ink)">{c.pin}</span>
                      <p className="text-(--ink)/40 mt-1">{labels.apunta}</p>
                    </div>
                  ) : (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={
                        s.tienePin
                          ? { background: 'rgba(74,111,80,0.12)', color: 'var(--green-deep)' }
                          : { background: 'rgba(201,123,74,0.12)', color: 'var(--terra)' }
                      }
                    >
                      {s.tienePin ? labels.conPin : labels.sinPin}
                      {s.tienePin && s.numeroUsuario ? ` · ${s.numeroUsuario}` : ''}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleReset(s.id)}
                    disabled={loadingId === s.id}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: 'var(--terra)', color: 'var(--bone)' }}
                  >
                    {loadingId === s.id ? labels.reiniciando : labels.reiniciarPin}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
