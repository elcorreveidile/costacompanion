import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de protección de rutas por rol.
 *
 * Rutas públicas:
 * - /, /auth/*, /unauthorized
 *
 * Rutas protegidas (requieren autenticación):
 * - /profile (cualquier rol autenticado)
 * - /cliente/* (solo rol='cliente')
 * - /acompanante/* (solo rol='acompanante')
 * - /anunciante/* (solo rol='anunciante')
 * - /admin/* (solo rol='superadmin')
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas - sin protección
  const publicRoutes = ["/", "/auth/login", "/auth/callback", "/unauthorized"];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Crear cliente de Supabase para middleware
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          request.cookies.delete(name);
          response.cookies.delete(name, options);
        },
      },
    }
  );

  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // No hay sesión → redirigir al login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar rol para rutas protegidas específicas
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    // No hay perfil → redirigir a login con error
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "no_profile");
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permisos por ruta
  const roleRoutes = {
    cliente: "/cliente",
    acompanante: "/acompanante",
    anunciante: "/anunciante",
    superadmin: "/admin",
  };

  // Verificar si el usuario tiene acceso a la ruta actual
  for (const [rol, route] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route) && profile.rol !== rol) {
      // Rol incorrecto → redirigir a no autorizado
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Ruta /profile requiere autenticación pero cualquier rol puede acceder
  if (pathname.startsWith("/profile")) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
