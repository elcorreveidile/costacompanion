import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { profiles, anunciantes } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { accederPortalStripeAnunciante, cancelarMiSuscripcionAnunciante } from "@/lib/anunciante/billing";
import type { EstadoStripe } from "@/types/supabase";
import { getI18n } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/config";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi Panel — Local Partner | Costa Companion' };

const STRIPE_BADGE: Record<EstadoStripe, { bg: string; color: string }> = {
  active:          { bg: 'rgba(74,111,80,0.12)',  color: 'var(--green-deep)' },
  trialing:        { bg: 'rgba(74,111,80,0.08)',  color: 'var(--green)' },
  past_due:        { bg: 'rgba(180,60,50,0.10)',  color: '#b43c32' },
  canceled:        { bg: 'rgba(43,39,36,0.08)',   color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

export default async function AnuncianteDashboard() {
  const user = await getSessionUser();
  if (!user) return null;

  const { locale, dict } = await getI18n();
  const t = dict.panelAnunciante;

  const [profile] = await db
    .select({ nombre: profiles.nombre })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const [fichaData] = await db
    .select({
      id: anunciantes.id,
      slug: anunciantes.slug,
      nombre_negocio: anunciantes.nombreNegocio,
      plan: anunciantes.plan,
      activo: anunciantes.activo,
      stripe_customer_id: anunciantes.stripeCustomerId,
      stripe_subscription_status: anunciantes.stripeSubscriptionStatus,
    })
    .from(anunciantes)
    .where(eq(anunciantes.profileId, user.id))
    .limit(1);

  const nombre = profile?.nombre || fichaData?.nombre_negocio || user.email || '';

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-1">{t.bienvenido.replace('{nombre}', nombre)}</h1>
          <p className="text-(--ink)/60">{t.areaLocalPartner}</p>
        </div>

        {/* Ficha pública */}
        {fichaData?.slug && (
          <a href={localePath(locale, `/local-partners/${fichaData.slug}`)}
            className="flex items-center justify-between gap-4 rounded-xl border px-6 py-4 mb-6 transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-(--green)">{t.miFichaPublica}</p>
                <p className="text-xs text-(--ink)/50">costacompanion.com/local-partners/{fichaData.slug}</p>
              </div>
            </div>
            <svg className="w-4 h-4 shrink-0 text-(--green)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Cards de navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link href={localePath(locale, "/anunciante/ficha")}
            className="rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--green)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">{t.cardFichaTitulo}</h3>
            <p className="text-sm text-(--ink)/60">{t.cardFichaDesc}</p>
          </Link>

          <Link href={localePath(locale, "/local-partners")}
            className="rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--terra)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">{t.cardDirectorioTitulo}</h3>
            <p className="text-sm text-(--ink)/60">{t.cardDirectorioDesc}</p>
          </Link>
        </div>

        {/* Suscripción */}
        {fichaData && (() => {
          const estado = fichaData.stripe_subscription_status ?? 'sin_suscripcion';
          const badge = STRIPE_BADGE[estado] ?? STRIPE_BADGE.sin_suscripcion;
          const estadoLabel = t.estados[estado] ?? t.estados.sin_suscripcion;
          return (
            <div className="bg-(--bone-2) rounded-xl p-6 shadow-sm border border-(--line) mb-4">
              <h3 className="font-medium text-(--green) mb-3">{t.suscripcionTitulo}</h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ background: badge.bg, color: badge.color }}>
                    {estadoLabel}
                  </span>
                  <span className="text-xs text-(--ink)/50">
                    {fichaData.plan === 'destacado' ? t.planDestacado : t.planBasico}
                  </span>
                  {estado === 'past_due' && (
                    <p className="text-sm w-full" style={{ color: '#b43c32' }}>
                      {t.pastDueAviso}
                    </p>
                  )}
                </div>
                {fichaData.stripe_customer_id && (
                  <div className="flex gap-2 flex-wrap">
                    <form action={accederPortalStripeAnunciante}>
                      <button type="submit" className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                        {t.verFacturas}
                      </button>
                    </form>
                    {estado !== 'canceled' && (
                      <form action={async () => { 'use server'; await cancelarMiSuscripcionAnunciante(); }}>
                        <button type="submit" className="text-sm px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                          style={{ borderColor: '#b43c32', color: '#b43c32' }}
                          title={t.cancelarTitle}>
                          {t.cancelarSuscripcion}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Cuenta */}
        <div className="bg-(--bone-2) rounded-lg p-6 shadow-sm border border-(--line) mb-4">
          <h3 className="font-medium text-(--green) mb-2">{t.cuentaTitulo}</h3>
          <div className="text-sm text-(--ink)/70 space-y-1">
            <p>{t.cuentaEmail}: {user.email}</p>
            {profile?.nombre ? <p>{t.cuentaNombre}: {profile.nombre}</p> : null}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={localePath(locale, "/profile")} className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}>
            {t.verPerfil}
          </Link>
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border font-medium text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}>
              {t.cerrarSesion}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
