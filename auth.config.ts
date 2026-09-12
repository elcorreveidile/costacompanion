import type { NextAuthConfig } from "next-auth";

/**
 * Configuración base de Auth.js — SEGURA PARA EDGE.
 *
 * No importa el adaptador, la BD (pg) ni providers Node (nodemailer/bcrypt),
 * porque este objeto lo usa el middleware, que corre en el runtime edge.
 * El adaptador y los providers se añaden en auth.ts (runtime Node).
 */

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

export default {
  pages: { signIn: "/auth/login" },
  providers: [], // se rellenan en auth.ts (Node)
  callbacks: {
    // Protección de rutas por rol (sustituye al middleware de Supabase).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
      if (!isProtected) return true;

      const user = auth?.user;
      if (!user) return false; // no autenticado → redirige a /auth/login

      const rol = user.rol;
      for (const [r, route] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route) && rol !== r) {
          return Response.redirect(new URL("/unauthorized", request.nextUrl));
        }
      }
      return true;
    },
    // Vuelca rol e id en el token en el momento del login (sin tocar la BD:
    // el objeto `user` del adaptador ya trae la fila de profiles).
    jwt({ token, user }) {
      if (user) {
        token.rol = user.rol;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? (token.sub as string);
        session.user.rol = token.rol as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
