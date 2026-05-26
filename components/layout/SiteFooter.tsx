import Link from 'next/link';
import { LogoSymbol } from '@/components/icons/LogoSymbol';

const waNum = process.env.NEXT_PUBLIC_WHATSAPP ?? '';
const waHref = waNum ? `https://wa.me/${waNum.replace(/\D/g, '')}` : '#';

export function SiteFooter() {
  return (
    <footer style={{ background: 'var(--green)' }} className="mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Col 1 — Marca */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <LogoSymbol strokeColor="#F7F4EF" dotColor="#E0A877" className="h-8 w-8 shrink-0" />
              <span className="font-display text-base font-medium" style={{ color: 'var(--bone)' }}>
                Costa Companion
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(247,244,239,0.65)' }}>
              A tu lado, en tu idioma.
            </p>
            <p className="text-xs" style={{ color: 'rgba(247,244,239,0.45)' }}>
              Estepona · Costa del Sol
            </p>
          </div>

          {/* Col 2 — Navegación */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: 'rgba(247,244,239,0.45)' }}>
              Navegar
            </p>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'Cómo funciona', href: '/#como-funciona' },
                { label: 'Servicios',     href: '/servicios' },
                { label: 'Para acompañantes', href: '/para-acompanantes' },
                { label: 'Para negocios', href: '/para-negocios' },
                { label: 'Directorio',    href: '/directorio' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(247,244,239,0.75)' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3 — Contacto */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: 'rgba(247,244,239,0.45)' }}>
              Contacto
            </p>
            <div className="flex flex-col gap-3">
              {waNum && (
                <a
                  href={waHref}
                  className="text-sm transition-opacity hover:opacity-70 flex items-center gap-2"
                  style={{ color: 'rgba(247,244,239,0.75)' }}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.09.537 4.09 1.475 5.838L0 24l6.316-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.587 9.587 0 01-4.893-1.341l-.351-.208-3.742.858.875-3.647-.228-.373A9.556 9.556 0 012.4 12c0-5.292 4.308-9.6 9.6-9.6s9.6 4.308 9.6 9.6-4.308 9.6-9.6 9.6z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              <span className="text-sm" style={{ color: 'rgba(247,244,239,0.4)' }}>
                Email: [pendiente]
              </span>
            </div>
          </div>

          {/* Col 4 — Legal */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: 'rgba(247,244,239,0.45)' }}>
              Legal
            </p>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'Términos y condiciones', href: '/legal/terminos' },
                { label: 'Política de privacidad', href: '/legal/privacidad' },
                { label: 'Política de cookies',    href: '/legal/cookies' },
                { label: 'Aviso de intermediación', href: '/legal/intermediacion' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(247,244,239,0.75)' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(247,244,239,0.12)', color: 'rgba(247,244,239,0.35)' }}
        >
          <span>© 2026 Costa Companion · Estepona, Costa del Sol</span>
          <Link href="/legal/intermediacion" className="hover:opacity-70 transition-opacity">
            Aviso de intermediación
          </Link>
        </div>
      </div>
    </footer>
  );
}
