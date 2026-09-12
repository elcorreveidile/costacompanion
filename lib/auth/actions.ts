"use server";

import { signIn, signOut as authSignOut } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

type IdiomaPreferido = "es" | "en" | "fr" | "de" | "nl";
const IDIOMAS_VALIDOS: IdiomaPreferido[] = ["es", "en", "fr", "de", "nl"];

/**
 * Envía un enlace mágico (Auth.js + SMTP de Brevo).
 * Redirige a /auth/login?sent=1 en caso de éxito.
 */
export async function signInWithMagicLink(formData: FormData): Promise<void> {
  const email = (formData.get("email") as string | null)?.trim();
  const next = (formData.get("redirect") as string | null) ?? "";

  if (!email || !email.includes("@")) {
    redirect("/auth/login?error=invalid_email");
  }

  try {
    await signIn("nodemailer", { email, redirect: false });
  } catch (error) {
    console.error("Error enviando Magic Link:", error);
    redirect("/auth/login?error=send_failed");
  }

  const sentUrl = next
    ? `/auth/login?sent=1&redirect=${encodeURIComponent(next)}`
    : "/auth/login?sent=1";
  redirect(sentUrl);
}

/**
 * Acceso con número de usuario + PIN (Auth.js, provider Credentials).
 * En éxito, signIn lanza la redirección a /post-login; si falla, capturamos
 * el AuthError y volvemos al login con error.
 */
export async function signInWithPin(formData: FormData): Promise<void> {
  const numeroUsuario = (formData.get("numeroUsuario") as string | null)?.trim();
  const pin = (formData.get("pin") as string | null) ?? "";

  if (!numeroUsuario || !pin) {
    redirect("/auth/login?error=pin");
  }

  try {
    await signIn("pin", { numeroUsuario, pin, redirectTo: "/post-login" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/auth/login?error=pin");
    }
    throw error; // re-lanza NEXT_REDIRECT (éxito) y otros
  }
}

/** Cierra la sesión y redirige al inicio. */
export async function signOut(): Promise<void> {
  await authSignOut({ redirectTo: "/" });
}

/** Actualiza el perfil del usuario autenticado. */
export async function updateProfile(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const nombre = formData.get("nombre") as string;
  const telefono = formData.get("telefono") as string;
  const rawIdioma = formData.get("idioma_preferido") as string;
  const idioma_preferido: IdiomaPreferido = IDIOMAS_VALIDOS.includes(
    rawIdioma as IdiomaPreferido
  )
    ? (rawIdioma as IdiomaPreferido)
    : "es";

  await db
    .update(profiles)
    .set({
      nombre: nombre || null,
      telefono: telefono || null,
      idiomaPreferido: idioma_preferido,
    })
    .where(eq(profiles.id, user.id));

  revalidatePath("/profile");
  redirect("/profile");
}
