import { createAdminClient } from '@/lib/supabase/admin';
import { toggleAprobada } from '@/lib/admin/resenas';
import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';

type RawClient = SupabaseClient;

interface ResenaConJoins {
  id: string;
  puntuacion: number;
  comentario: string | null;
  aprobada: boolean;
  created_at: string;
  acompanante_id: string;
  cliente_id: string;
  reserva_id: string | null;
  acompanantes: { nombre_publico: string; slug: string } | null;
  profiles: { nombre: string | null } | null;
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reseñas | Admin Costa Companion' };

export default async function AdminResenasPage() {
  const admin = createAdminClient();

  const { data: resenasData } = await (admin as RawClient)
    .from('resenas')
    .select('*, acompanantes(nombre_publico, slug), profiles(nombre)')
    .order('created_at', { ascending: false });

  const resenas = (resenasData ?? []) as unknown as ResenaConJoins[];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al panel
          </Link>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          Reseñas
        </h1>
        <p className="text-(--ink)/60 mb-8">
          {resenas.length} reseña{resenas.length !== 1 ? 's' : ''} en total
        </p>

        {resenas.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40 text-lg">No hay reseñas todavía</p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: 'var(--line)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bone-2)', borderBottom: '1px solid var(--line)' }}>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/60">Acompañante</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/60">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/60">Puntuación</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/60">Comentario</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/60">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-(--ink)/60">Estado</th>
                </tr>
              </thead>
              <tbody>
                {resenas.map((resena, idx) => (
                  <tr
                    key={resena.id}
                    style={{
                      background: idx % 2 === 0 ? 'var(--bone)' : 'var(--bone-2)',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    {/* Acompañante */}
                    <td className="px-4 py-3">
                      {resena.acompanantes ? (
                        <Link
                          href={`/${resena.acompanantes.slug}`}
                          className="font-medium text-(--green) hover:opacity-70 transition-opacity"
                          target="_blank"
                        >
                          {resena.acompanantes.nombre_publico}
                        </Link>
                      ) : (
                        <span className="text-(--ink)/40">—</span>
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3 text-(--ink)/70">
                      {resena.profiles?.nombre ?? <span className="text-(--ink)/30">Anónimo</span>}
                    </td>

                    {/* Puntuación */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill={star <= resena.puntuacion ? 'var(--terra)' : 'none'}
                            stroke="var(--terra)"
                            strokeWidth={1.5}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-(--ink)/50">({resena.puntuacion})</span>
                      </div>
                    </td>

                    {/* Comentario */}
                    <td className="px-4 py-3 text-(--ink)/70 max-w-xs">
                      {resena.comentario ? (
                        <span title={resena.comentario}>
                          {resena.comentario.length > 80
                            ? resena.comentario.slice(0, 80) + '…'
                            : resena.comentario}
                        </span>
                      ) : (
                        <span className="text-(--ink)/30">Sin comentario</span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-(--ink)/50 whitespace-nowrap">
                      {new Date(resena.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Aprobada toggle */}
                    <td className="px-4 py-3">
                      <form
                        action={async () => {
                          'use server';
                          await toggleAprobada(resena.id, !resena.aprobada);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                          style={
                            resena.aprobada
                              ? { background: 'rgba(74,111,80,0.12)', color: 'var(--green-deep)' }
                              : { background: 'rgba(201,123,74,0.12)', color: 'var(--terra)' }
                          }
                        >
                          {resena.aprobada ? 'Aprobada ✓' : 'Despublicada'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
