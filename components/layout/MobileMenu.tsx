'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LogoSymbol } from '@/components/icons/LogoSymbol';

interface MobileMenuProps {
  isLoggedIn: boolean;
  accountHref: string;
}

const NAV = [
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Servicios',      href: '/servicios' },
  { label: 'Acompañantes',   href: '/para-acompanantes' },
  { label: 'Para negocios',  href: '/para-negocios' },
];

export function MobileMenu({ isLoggedIn, accountHref }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col gap-1.5 p-2 sm:hidden"
      >
        <span
          className="block w-5 h-px transition-all duration-300"
          style={{
            background: 'var(--bone)',
            transform: open ? 'translateY(5px) rotate(45deg)' : 'none',
          }}
        />
        <span
          className="block w-5 h-px transition-all duration-300"
          style={{
            background: 'var(--bone)',
            opacity: open ? 0 : 1,
          }}
        />
        <span
          className="block w-5 h-px transition-all duration-300"
          style={{
            background: 'var(--bone)',
            transform: open ? 'translateY(-5px) rotate(-45deg)' : 'none',
          }}
        />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setOpen(false)}
          style={{ background: 'rgba(43,39,36,0.4)' }}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col sm:hidden transition-transform duration-300"
        style={{
          background: 'var(--green)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(247,244,239,0.15)' }}>
          <div className="flex items-center gap-2">
            <LogoSymbol strokeColor="#F7F4EF" dotColor="#E0A877" className="h-7 w-7" />
            <span className="font-display text-base font-medium" style={{ color: 'var(--bone)' }}>Costa Companion</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-1" style={{ color: 'var(--bone)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col px-6 py-8 gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium border-b transition-opacity hover:opacity-70"
              style={{ color: 'var(--bone)', borderColor: 'rgba(247,244,239,0.12)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-6 pb-8">
          <Link
            href={accountHref}
            onClick={() => setOpen(false)}
            className="block w-full text-center py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
          >
            {isLoggedIn ? 'Mi cuenta' : 'Entrar'}
          </Link>
        </div>
      </div>
    </>
  );
}
