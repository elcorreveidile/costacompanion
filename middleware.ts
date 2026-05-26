import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de protección de rutas por rol.
 *
 * Solo protege prefijos específicos:
 * - /profile (cualquier rol autenticado)
 * - /cliente/* (solo rol='cliente')
 * - /acompanante/* (solo rol='acompanante')
 * - /anunciante/* (solo rol='anunciante')
 * - /admin/* (solo rol='superadmin')
 *
 * Todo lo demás (/, /directorio, /{slug}, /auth/*, etc.) es público.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger prefijos específicos; todo lo demás es público
  const protectedPrefixes = [
    "/cliente",
    "/acompanante",
    "/anunciante",
    "/admin",
    "/profile",
  ];
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Crear cliente de Supabase con la API getAll/setAll (requerida en @supabase/ssr ≥0.5)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar rol para rutas protegidas específicas
  const { data: profile } = (await supabase
    .from("profiles")
    .select("rol")
    .eq("id", session.user.id)
    .single()) as { data: { rol: string } | null; error: null };

  if (!profile) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "no_profile");
    return NextResponse.redirect(loginUrl);
  }

  const roleRoutes: Record<string, string> = {
    cliente: "/cliente",
    acompanante: "/acompanante",
    anunciante: "/anunciante",
    superadmin: "/admin",
  };

  for (const [rol, route] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route) && profile.rol !== rol) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
