import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { accederPortalStripe } from "@/lib/acompanante/billing";
import Link from "next/link";

type EstadoStripe = 'sin_suscripcion' | 'active' | 'past_due' | 'canceled' | 'trialing';

const STRIPE_BADGE: Record<EstadoStripe, { label: string; bg: string; color: string }> = {
  active:          { label: 'Activa',           bg: 'rgba(74,111,80,0.12)',  color: 'var(--green-deep)' },
  trialing:        { label: 'Período de prueba', bg: 'rgba(74,111,80,0.08)',  color: 'var(--green)' },
  past_due:        { label: 'Pago pendiente',   bg: 'rgba(180,60,50,0.10)',  color: '#b43c32' },
  canceled:        { label: 'Cancelada',        bg: 'rgba(43,39,36,0.08)',   color: 'rgba(43,39,36,0.5)' },
  sin_suscripcion: { label: 'Sin suscripción',  bg: 'rgba(201,123,74,0.12)', color: 'var(--terra)' },
};

export const metadata = { title: 'Mi Panel — Acompañante | Costa Companion' };

export default async function AcompananteDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single() as { data: { nombre: string | null; rol: string } | null; error: null };

  const nombre = profile?.nombre || user.email;

  const { data: fichaData } = await supabase
    .from('acompanantes')
    .select('slug, stripe_customer_id, stripe_subscription_status')
    .eq('profile_id', user.id)
    .single() as { data: { slug: string; stripe_customer_id: string | null; stripe_subscription_status: EstadoStripe } | null; error: null };

  const panelSections = [
    {
      href: '/acompanante/ficha',
      title: 'Mi ficha',
      description: 'Edita tu presentación pública: bio, idiomas, zonas, foto y datos de contacto.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'var(--green)',
    },
    {
      href: '/acompanante/servicios',
      title: 'Mis servicios',
      description: 'Gestiona los servicios que ofreces: categorías, precios, paquetes de clases.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'var(--green-deep)',
    },
    {
      href: '/acompanante/disponibilidad',
      title: 'Disponibilidad',
      description: 'Publica tus franjas horarias disponibles para que los clientes puedan reservar.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
      color: 'var(--terra)',
    },
    {
      href: '/acompanante/reservas',
      title: 'Reservas',
      description: 'Gestiona las reservas de cita recibidas: confirma, rechaza o marca como completadas.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'var(--green)',
    },
    {
      href: '/acompanante/solicitudes',
      title: 'Solicitudes',
      description: 'Revisa las solicitudes a medida de tus clientes y propón condiciones.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: 'var(--terra)',
    },
    {
      href: '/acompanante/mensajes',
      title: 'Mis mensajes',
      description: 'Chat directo con tus clientes para coordinar detalles.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: 'var(--green-deep)',
    },
  ];

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            Bienvenido, {nombre}
          </h1>
          <p className="text-lg text-(--ink)/70">
            Tu área de acompañante
          </p>
        </div>

        {/* Banner: ver web pública */}
        {fichaData?.slug && (
          <a
            href={`/${fichaData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-xl border px-6 py-4 mb-6 transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-(--green)">Mi página pública</p>
                <p className="text-xs text-(--ink)/50">costacompanion.com/{fichaData.slug}</p>
              </div>
            </div>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--green)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Cards de navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {panelSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: section.color }}
              >
                {section.icon}
              </div>
              <h3 className="font-display text-lg font-medium text-(--green) mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-(--ink)/60">
                {section.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Suscripción */}
        {fichaData && (() => {
          const estado = fichaData.stripe_subscription_status ?? 'sin_suscripcion';
          const badge = STRIPE_BADGE[estado] ?? STRIPE_BADGE.sin_suscripcion;
          return (
            <div className="bg-(--bone-2) rounded-xl p-6 shadow-sm border border-(--line) mb-4">
              <h3 className="font-medium text-(--green) mb-3">Tu suscripción</h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {estado === 'past_due' && (
                    <p className="text-sm" style={{ color: '#b43c32' }}>
                      Hay una factura pendiente de pago. Revisa tu correo o accede al portal.
                    </p>
                  )}
                  {estado === 'sin_suscripcion' && (
                    <p className="text-sm text-(--ink)/60">
                      Contacta con el equipo de Costa Companion para activar tu cuenta.
                    </p>
                  )}
                </div>
                {fichaData.stripe_customer_id && (
                  <form action={accederPortalStripe}>
                    <button
                      type="submit"
                      className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                      style={{ background: 'var(--green)', color: 'var(--bone)' }}
                    >
                      Gestionar suscripción →
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* Información de cuenta */}
        <div className="bg-(--bone-2) rounded-lg p-6 shadow-sm border border-(--line) mb-4">
          <h3 className="font-medium text-(--green) mb-2">Información de tu cuenta</h3>
          <div className="text-sm text-(--ink)/70 space-y-1">
            <p>Email: {user.email}</p>
            <p>Rol: Acompañante</p>
            {profile?.nombre && <p>Nombre: {profile.nombre}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
          >
            Ver mi perfil
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border font-medium text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
