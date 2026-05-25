"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Envía un Magic Link al email del usuario.
 * Si el usuario no existe, Supabase lo creará automáticamente
 * y el trigger de BD creará su perfil con rol='cliente'.
 */
export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { error: "Por favor, introduce un email válido." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error enviando Magic Link:", error);
    return { error: "Error al enviar el enlace mágico. Por favor, inténtalo de nuevo." };
  }

  return {
    success: "Hemos enviado un enlace mágico a tu email. Haz clic en el enlace para acceder.",
  };
}

/**
 * Cierra la sesión del usuario.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error cerrando sesión:", error);
    return { error: "Error al cerrar sesión." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Actualiza el perfil del usuario.
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa." };
  }

  const nombre = formData.get("nombre") as string;
  const telefono = formData.get("telefono") as string;
  const idioma_preferido = formData.get("idioma_preferido") as string;

  // Validar idioma_preferido
  const idiomasValidos = ["es", "en", "fr", "de", "nl"];
  if (idioma_preferido && !idiomasValidos.includes(idioma_preferido)) {
    return { error: "Idioma no válido." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nombre: nombre || null,
      telefono: telefono || null,
      idioma_preferido: idioma_preferido || "es",
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error actualizando perfil:", error);
    return { error: "Error al actualizar el perfil." };
  }

  revalidatePath("/profile");
  return { success: "Perfil actualizado correctamente." };
}
