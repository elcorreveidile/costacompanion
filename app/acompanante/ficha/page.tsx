import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getAcompananteByProfileId } from '@/lib/db/queries/public';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import { FichaAcompananteForm } from './FichaAcompananteForm';

export const metadata = { title: 'Mi ficha | Costa Companion' };

export default async function AcompananteFichaPage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelAcompanante.ficha;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const acompanante = await getAcompananteByProfileId(user.id);

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, "/acompanante")} className="hover:text-(--ink) transition-colors">{dict.panelAcompanante.shared.miPanel}</a>
          <span>›</span>
          <span className="text-(--ink)/80">{t.breadcrumb}</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            {t.h1}
          </h1>
          {acompanante?.slug && (
            <a
              href={localePath(locale, `/${acompanante.slug}`)}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--green)', color: 'var(--green)', background: 'transparent' }}
            >
              {t.verWebPublica}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        <p className="text-(--ink)/60 mb-8">
          {t.subtitulo}
        </p>

        <div
          className="rounded-xl border shadow-sm p-8"
          style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
        >
          {!acompanante ? (
            <p className="text-(--ink)/50 text-center py-8">
              {t.noFicha}
            </p>
          ) : (
            <FichaAcompananteForm acompanante={acompanante} t={t} modalidades={dict.common.modalidades} locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}
