import NextAuth from "next-auth";
import authConfig from "@/auth.config";

/**
 * Protección de rutas por rol, vía Auth.js (edge-safe).
 *
 * La lógica de qué se protege y con qué rol vive en el callback `authorized`
 * de auth.config.ts. Este middleware solo lo aplica. No importa el adaptador
 * ni la BD, así que es compatible con el runtime edge.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
