import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tarifas, zonas, configPrecios } from '@/lib/db/schema';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import { TarifasClient } from './TarifasClient';

export const dynamic = 'force-dynamic';

export default async function AdminTarifasPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin;

  const [tarifasRows, zonasRows, configRows] = await Promise.all([
    db.select().from(tarifas).orderBy(asc(tarifas.orden)),
    db.select().from(zonas).where(eq(zonas.activo, true)).orderBy(asc(zonas.orden)),
    db.select().from(configPrecios).orderBy(asc(configPrecios.clave)),
  ]);

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, '/admin')} className="hover:text-(--ink) transition-colors">
            {t.shared.admin}
          </a>
          <span>›</span>
          <span className="text-(--ink)/80">{t.tarifas.titulo}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          {t.tarifas.titulo}
        </h1>
        <p className="text-(--ink)/60 mb-8">{t.tarifas.subtitulo}</p>

        <TarifasClient
          tarifas={tarifasRows.map((r) => ({ key: r.key, descripcion: (r.descripcion ?? {}) as Record<string, string>, importeCents: r.importeCents, unidad: r.unidad }))}
          zonas={zonasRows.map((r) => ({ key: r.key, nombre: (r.nombre ?? {}) as Record<string, string>, recargoCents: r.recargoCents }))}
          config={configRows.map((r) => ({ clave: r.clave, valorEntero: r.valorEntero, descripcion: r.descripcion }))}
          t={t.tarifas}
        />
      </div>
    </div>
  );
}
