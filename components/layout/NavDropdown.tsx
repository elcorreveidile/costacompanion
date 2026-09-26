'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface NavDropdownProps {
  label: string;
  items: { label: string; href: string }[];
}

/**
 * Desplegable del nav de escritorio (mismo patrón que LanguageSwitcher:
 * cierra al hacer click fuera y al navegar). Panel hueso con enlaces tinta.
 */
export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'rgba(247,244,239,0.85)' }}
      >
        {label}
        <svg
          className="w-3.5 h-3.5 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 mt-3 py-1 rounded-lg shadow-lg z-50 min-w-[13rem]"
          style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm transition-colors hover:opacity-60"
              style={{ color: 'var(--ink)' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
