import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import type { Acompanante } from '@/types/supabase';
import { FichaAdminForm } from './FichaAdminForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminAcompananteEditPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('acompanantes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const acompanante = data as unknown as Acompanante;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href="/admin" className="hover:text-(--ink) transition-colors">Admin</a>
          <span>›</span>
          <a href="/admin/acompanantes" className="hover:text-(--ink) transition-colors">Acompañantes</a>
          <span>›</span>
          <span className="text-(--ink)/80">{acompanante.nombre_publico}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-(--green)">
              {acompanante.nombre_publico}
            </h1>
            <p className="text-(--ink)/50 text-sm mt-1 font-mono">{acompanante.slug}</p>
          </div>
          <a
            href={`/${acompanante.slug}`}
            className="text-sm text-(--green) hover:opacity-70 transition-opacity mt-1"
          >
            Ver microsite →
          </a>
        </div>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          <FichaAdminForm acompanante={acompanante} />
        </div>
      </div>
    </div>
  );
}
