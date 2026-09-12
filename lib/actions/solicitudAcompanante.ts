"use server";

import { db } from "@/lib/db";
import { solicitudesAcompanante } from "@/lib/db/schema";

export async function enviarSolicitudAcompanante(
  formData: FormData
): Promise<{ error?: string }> {
  const nombre = (formData.get("nombre") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const telefono = (formData.get("telefono") as string | null)?.trim() || null;
  const zona = (formData.get("zona") as string | null)?.trim() || null;
  const mensaje = (formData.get("mensaje") as string | null)?.trim() || null;
  const idiomas = formData.getAll("idioma").map(String).filter(Boolean);

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!email || !email.includes("@")) return { error: "El email no es válido." };

  try {
    await db
      .insert(solicitudesAcompanante)
      .values({ nombre, email, telefono, idiomas, zona, mensaje });
  } catch (e) {
    console.error("enviarSolicitudAcompanante:", e);
    return { error: "No se pudo enviar la solicitud. Inténtalo de nuevo." };
  }
  return {};
}
