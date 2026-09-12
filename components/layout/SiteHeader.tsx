import { LogoSymbol } from '@/components/icons/LogoSymbol';
import Link from 'next/link';
import { MobileMenu } from './MobileMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';

async function getSessionData() {
  try {
    const { getSessionUser } = await import('@/lib/auth/session');
    const user = await getSessionUser();
    if (!user) return null;
    return { rol: user.rol ?? 'cliente' };
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
  const { locale, dict } = await getI18n();
  const session = await getSessionData();
  const href = localePath(locale, accountHref(session?.rol ?? null));
  const accountLabel = session ? dict.account.myAccount : dict.account.login;

  const navItems = [
    { label: dict.nav.comoFunciona, href: localePath(locale, '/#como-funciona') },
    { label: dict.nav.servicios, href: localePath(locale, '/servicios') },
    { label: dict.nav.paraAcompanantes, href: localePath(locale, '/para-acompanantes') },
    { label: dict.nav.paraNegocios, href: localePath(locale, '/para-negocios') },
  ];

  return (
    <header className="w-full sticky top-0 z-30" style={{ background: 'var(--green)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={localePath(locale, '/')} className="flex items-center gap-2.5 shrink-0">
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
          {navItems.map((item) => (
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

        {/* Desktop: idioma + CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <LanguageSwitcher current={locale} />
          <Link
            href={href}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
          >
            {accountLabel}
          </Link>
        </div>

        {/* Mobile: idioma + hamburguesa */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSwitcher current={locale} />
          <MobileMenu accountHref={href} accountLabel={accountLabel} navItems={navItems} />
        </div>
      </div>
    </header>
  );
}
