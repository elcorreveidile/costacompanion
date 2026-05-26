import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/lib/auth/actions";
import { accederPortalStripeAnunciante, cancelarMiSuscripcionAnunciante } from "@/lib/anunciante/billing";
import Link from "next/link";
import type { Anunciante, EstadoStripe } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi Panel — Local Partner | Costa Companion' };

type RawClient = SupabaseClient;

const STRIPE_BADGE: Record<EstadoStripe, { label: string; bg: string; color: string }> = {
  active:          { label: 'Activa',            bg: 'rgba(74,111,80,0.12)',  color: 'var(--green-deep)' },
  trialing:        { label: 'Período de prueba', bg: 'rgba(74,111,80,0.08)',  color: 'var(--green)' },
  past_due:        { label: 'Pago pendiente',    bg: 'rgba(180,60,50,0.10)',  color: '#b43c32' },
  canceled:        { label: 'Cancelada',         bg: 'rgba(43,39,36,0.08)',   color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { label: 'Sin suscripción',   bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

export default async function AnuncianteDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles").select("nombre, rol").eq("id", user.id).single() as
    { data: { nombre: string | null; rol: string } | null; error: null };

  const admin = createAdminClient();
  const { data: fichaData } = await (admin as RawClient)
    .from('anunciantes')
    .select('id, slug, nombre_negocio, plan, activo, stripe_customer_id, stripe_subscription_status')
    .eq('profile_id', user.id)
    .single() as { data: Pick<Anunciante, 'id' | 'slug' | 'nombre_negocio' | 'plan' | 'activo' | 'stripe_customer_id' | 'stripe_subscription_status'> | null };

  const nombre = profile?.nombre || fichaData?.nombre_negocio || user.email;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-1">Bienvenido, {nombre}</h1>
          <p className="text-(--ink)/60">Tu área de Local Partner</p>
        </div>

        {/* Ficha pública */}
        {fichaData?.slug && (
          <a href={`/local-partners/${fichaData.slug}`}
            className="flex items-center justify-between gap-4 rounded-xl border px-6 py-4 mb-6 transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-(--green)">Mi ficha pública</p>
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
          <Link href="/anunciante/ficha"
            className="rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--green)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">Mi ficha</h3>
            <p className="text-sm text-(--ink)/60">Edita tu descripción, logo, web y datos de contacto.</p>
          </Link>

          <Link href="/local-partners"
            className="rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--terra)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">Directorio</h3>
            <p className="text-sm text-(--ink)/60">Ver el directorio público de Local Partners.</p>
          </Link>
        </div>

        {/* Suscripción */}
        {fichaData && (() => {
          const estado = fichaData.stripe_subscription_status ?? 'sin_suscripcion';
          const badge = STRIPE_BADGE[estado] ?? STRIPE_BADGE.sin_suscripcion;
          return (
            <div className="bg-(--bone-2) rounded-xl p-6 shadow-sm border border-(--line) mb-4">
              <h3 className="font-medium text-(--green) mb-3">Tu suscripción</h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-(--ink)/50">
                    Plan {fichaData.plan === 'destacado' ? 'Destacado — 79 €/mes' : 'Básico — 29 €/mes'}
                  </span>
                  {estado === 'past_due' && (
                    <p className="text-sm w-full" style={{ color: '#b43c32' }}>
                      Hay una factura pendiente. Revisa tu correo o accede al portal de facturación.
                    </p>
                  )}
                </div>
                {fichaData.stripe_customer_id && (
                  <div className="flex gap-2 flex-wrap">
                    <form action={accederPortalStripeAnunciante}>
                      <button type="submit" className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--green)', color: 'var(--bone)' }}>
                        Ver facturas →
                      </button>
                    </form>
                    {estado !== 'canceled' && (
                      <form action={async () => { 'use server'; await cancelarMiSuscripcionAnunciante(); }}>
                        <button type="submit" className="text-sm px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                          style={{ borderColor: '#b43c32', color: '#b43c32' }}
                          title="Tu ficha seguirá visible hasta el final del período actual">
                          Cancelar suscripción
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
          <h3 className="font-medium text-(--green) mb-2">Información de cuenta</h3>
          <div className="text-sm text-(--ink)/70 space-y-1">
            <p>Email: {user.email}</p>
            {profile?.nombre && <p>Nombre: {profile.nombre}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/profile" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}>
            Ver mi perfil
          </Link>
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border font-medium text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
