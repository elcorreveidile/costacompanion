import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Callback de Magic Link.
 * Supabase redirige aquí con el token en la URL.
 * Procesamos la sesión y redirigimos según el rol del usuario.
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  if (params?.code) {
    // Intercambiar el código por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      console.error("Error intercambiando código:", error);
      redirect("/auth/login?error=invalid_token");
    }

    // Obtener el rol del usuario
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/login?error=no_user");
    }

    // Leer el rol desde profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single() as { data: { rol: string } | null; error: null };

    if (!profile) {
      console.error("No se encontró perfil para usuario:", user.id);
      redirect("/auth/login?error=no_profile");
    }

    // Redirigir según el rol
    switch (profile.rol) {
      case "cliente":
        redirect("/cliente");
      case "acompanante":
        redirect("/acompanante");
      case "anunciante":
        redirect("/anunciante");
      case "superadmin":
        redirect("/admin");
      default:
        redirect("/auth/login?error=invalid_role");
    }
  }

  // Si no hay código, redirigir al login
  redirect("/auth/login");
}
