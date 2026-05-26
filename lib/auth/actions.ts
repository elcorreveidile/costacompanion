"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type IdiomaPreferido = "es" | "en" | "fr" | "de" | "nl";
const IDIOMAS_VALIDOS: IdiomaPreferido[] = ["es", "en", "fr", "de", "nl"];

/**
 * Envía un Magic Link al email del usuario.
 * Redirige a /auth/login?sent=1 en caso de éxito.
 */
export async function signInWithMagicLink(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const next = (formData.get("redirect") as string | null) ?? "";

  if (!email || !email.includes("@")) {
    redirect("/auth/login?error=invalid_email");
  }

  const callbackUrl = next
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  });

  if (error) {
    console.error("Error enviando Magic Link:", error);
    redirect("/auth/login?error=send_failed");
  }

  const sentUrl = next ? `/auth/login?sent=1&redirect=${encodeURIComponent(next)}` : "/auth/login?sent=1";
  redirect(sentUrl);
}

/**
 * Cierra la sesión del usuario y redirige al inicio.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error cerrando sesión:", error);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Actualiza el perfil del usuario y recarga la página.
 */
export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const nombre = formData.get("nombre") as string;
  const telefono = formData.get("telefono") as string;
  const rawIdioma = formData.get("idioma_preferido") as string;
  const idioma_preferido: IdiomaPreferido = IDIOMAS_VALIDOS.includes(rawIdioma as IdiomaPreferido)
    ? (rawIdioma as IdiomaPreferido)
    : "es";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      nombre: nombre || null,
      telefono: telefono || null,
      idioma_preferido,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error actualizando perfil:", error);
  }

  revalidatePath("/profile");
  redirect("/profile");
}
