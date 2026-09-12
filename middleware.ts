import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import {
  defaultLocale,
  prefixedLocales,
  localePath,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Middleware combinado:
 *  1. Idioma: español en la raíz; "/en", "/fr", "/de", "/nl", "/ru", "/uk" con
 *     prefijo. Reescribe internamente la ruta sin prefijo y pasa el idioma a las
 *     páginas por la cabecera x-locale. "/es/…" redirige a "/…" (canónico).
 *  2. Protección de rutas por rol (sustituye al callback `authorized`, que no se
 *     usa cuando se pasa un handler a auth()).
 */

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = [
  "/cliente",
  "/acompanante",
  "/anunciante",
  "/admin",
  "/profile",
] as const;

const ROLE_ROUTES: Record<string, string> = {
  cliente: "/cliente",
  acompanante: "/acompanante",
  anunciante: "/anunciante",
  superadmin: "/admin",
};

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + "/");
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const firstSeg = pathname.split("/")[1];

  // "/es/…" → "/…" (el español vive en la raíz).
  if (firstSeg === defaultLocale) {
    const url = nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  // Idioma con prefijo.
  let locale: Locale = defaultLocale;
  let path = pathname;
  if ((prefixedLocales as readonly string[]).includes(firstSeg)) {
    locale = firstSeg as Locale;
    path = pathname.slice(firstSeg.length + 1) || "/";
  }

  // Protección por rol (sobre la ruta sin prefijo).
  const isProtected = PROTECTED_PREFIXES.some((p) => matchesPrefix(path, p));
  if (isProtected) {
    const user = req.auth?.user as { rol?: string } | undefined;
    if (!user) {
      const url = nextUrl.clone();
      url.pathname = localePath(locale, "/auth/login");
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    for (const [rol, route] of Object.entries(ROLE_ROUTES)) {
      if (matchesPrefix(path, route) && user.rol !== rol) {
        const url = nextUrl.clone();
        url.pathname = localePath(locale, "/unauthorized");
        return NextResponse.redirect(url);
      }
    }
  }

  // Propaga el idioma; reescribe a la ruta sin prefijo si lo llevaba.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  // Ruta sin prefijo de idioma, para construir canonical + hreflang en el layout.
  requestHeaders.set("x-pathname", path);

  if (path !== pathname) {
    const url = nextUrl.clone();
    url.pathname = path;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
