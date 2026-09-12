import type { DefaultSession } from "next-auth";

/**
 * Ampliación de tipos de Auth.js para llevar `id` y `rol` en la sesión y el JWT.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol?: string;
    } & DefaultSession["user"];
  }
  interface User {
    rol?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol?: string;
    uid?: string;
  }
}
