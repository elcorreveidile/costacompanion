import { LogoSymbol } from '@/components/icons/LogoSymbol';
import Link from 'next/link';
import { MobileMenu } from './MobileMenu';

const NAV = [
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Servicios',     href: '/servicios' },
  { label: 'Acompañantes',  href: '/para-acompanantes' },
  { label: 'Para negocios', href: '/para-negocios' },
];

async function getSessionData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single() as { data: { rol: string } | null; error: null };
    return { rol: profile?.rol ?? 'cliente' };
  } catch {
    return null;
  }
}

function accountHref(rol: string | null) {
  if (!rol) return '/auth/login';
  if (rol === 'superadmin') return '/admin';
  if (rol === 'acompanante') return '/acompanante';
  if (rol === 'anunciante') return '/anunciante';
  return '/profile';
}

export async function SiteHeader() {
  const session = await getSessionData();
  const href = accountHref(session?.rol ?? null);

  return (
    <header className="w-full sticky top-0 z-30" style={{ background: 'var(--green)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LogoSymbol strokeColor="#F7F4EF" dotColor="#E0A877" className="h-8 w-8" />
          <span
            className="font-display text-lg font-medium tracking-tight"
            style={{ color: 'var(--bone)' }}
          >
            Costa Companion
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: 'rgba(247,244,239,0.85)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          href={href}
          className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--terra)', color: 'var(--bone)' }}
        >
          {session ? 'Mi cuenta' : 'Entrar'}
        </Link>

        {/* Mobile hamburger (client component) */}
        <MobileMenu isLoggedIn={!!session} accountHref={href} />
      </div>
    </header>
  );
}
