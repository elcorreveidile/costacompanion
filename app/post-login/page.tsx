import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Punto de aterrizaje tras el login. Lee la sesión y redirige al panel
 * correspondiente al rol. Auth.js manda aquí tras un login correcto.
 */
const DESTINOS: Record<string, string> = {
  cliente: "/cliente",
  acompanante: "/acompanante",
  anunciante: "/anunciante",
  superadmin: "/admin",
};

export default async function PostLoginPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  redirect(DESTINOS[user.rol ?? ""] ?? "/");
}
