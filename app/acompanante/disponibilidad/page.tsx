import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getMiAcompananteId, getDisponibilidadDe } from '@/lib/db/queries/acompanante';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import { DisponibilidadManager } from './DisponibilidadManager';

export const metadata = { title: 'Disponibilidad | Costa Companion' };

export default async function AcompananteDisponibilidadPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelAcompanante;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const acompananteId = await getMiAcompananteId(user.id);

  const lista = acompananteId ? await getDisponibilidadDe(acompananteId) : [];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, "/acompanante")} className="hover:text-(--ink) transition-colors">{t.shared.miPanel}</a>
          <span>›</span>
          <span className="text-(--ink)/80">{t.disponibilidad.breadcrumb}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
          {t.disponibilidad.h1}
        </h1>
        <p className="text-(--ink)/60 mb-8">
          {t.disponibilidad.subtitulo}
        </p>

        {!acompananteId ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/50">{t.shared.noFicha}</p>
          </div>
        ) : (
          <DisponibilidadManager
            franjas={lista}
            t={t.disponibilidad}
            modalidades={dict.common.modalidades}
            eliminar={t.shared.eliminar}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
