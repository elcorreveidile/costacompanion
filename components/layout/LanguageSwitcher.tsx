"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  locales,
  localeNames,
  localeShort,
  prefixedLocales,
  defaultLocale,
  localePath,
  type Locale,
} from "@/lib/i18n/config";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Ruta base sin prefijo de idioma.
  const seg = pathname.split("/")[1];
  const base =
    (prefixedLocales as readonly string[]).includes(seg)
      ? pathname.slice(seg.length + 1) || "/"
      : pathname;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Idioma / Language"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
        style={{ color: "rgba(247,244,239,0.85)", border: "1px solid rgba(247,244,239,0.25)" }}
      >
        {localeShort[current]}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 py-1 rounded-lg shadow-lg z-50 min-w-[9rem]"
          style={{ background: "var(--bone)", border: "1px solid var(--line)" }}
        >
          {(locales as readonly Locale[]).map((l) => {
            const href = l === defaultLocale ? base : localePath(l, base);
            const isCurrent = l === current;
            // Navegación dura (no <Link>): al no existir segmento [locale], una
            // navegación cliente reutilizaría el layout cacheado y el idioma solo
            // cambiaría a medias. Un <a> fuerza recarga y re-render con x-locale.
            return (
              <a
                key={l}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors"
                style={{
                  color: "var(--ink)",
                  background: isCurrent ? "rgba(44,74,59,0.08)" : "transparent",
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                <span>{localeNames[l]}</span>
                <span style={{ color: "var(--ink)", opacity: 0.4 }}>{localeShort[l]}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
