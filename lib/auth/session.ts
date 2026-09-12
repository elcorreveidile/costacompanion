import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Helpers de sesión para código de servidor, sobre Auth.js.
 * Sustituyen a `supabase.auth.getUser()` + lectura de `profiles.rol`.
 */

export interface SessionUser {
  id: string;
  rol?: string;
  email?: string | null;
  name?: string | null;
}

/** Usuario autenticado actual, o null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    rol: session.user.rol,
    email: session.user.email,
    name: session.user.name,
  };
}

/** Exige sesión; si no hay, redirige al login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  return user;
}

/** Exige un rol concreto; si no cuadra, redirige a /unauthorized (o al login). */
export async function requireRole(rol: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.rol !== rol) redirect("/unauthorized");
  return user;
}
