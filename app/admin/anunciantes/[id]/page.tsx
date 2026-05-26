import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Anunciante } from '@/types/supabase';
import { FichaAdminFormAnunciante } from './FichaAdminFormAnunciante';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminAnuncianteEditPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin.from('anunciantes').select('*').eq('id', id).single();
  if (error || !data) notFound();

  const anunciante = data as unknown as Anunciante;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/admin" className="hover:text-(--ink) transition-colors">Admin</a>
          <span>›</span>
          <a href="/admin/anunciantes" className="hover:text-(--ink) transition-colors">Anunciantes</a>
          <span>›</span>
          <span className="text-(--ink)/80">{anunciante.nombre_negocio}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-(--green)">{anunciante.nombre_negocio}</h1>
            <p className="text-(--ink)/50 text-sm mt-1 font-mono">{anunciante.slug}</p>
          </div>
          <a href={`/local-partners/${anunciante.slug}`}
            className="text-sm text-(--green) hover:opacity-70 transition-opacity mt-1">
            Ver ficha pública →
          </a>
        </div>

        <div className="rounded-xl border shadow-sm p-8" style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
          <FichaAdminFormAnunciante anunciante={anunciante} />
        </div>
      </div>
    </div>
  );
}
