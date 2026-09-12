"use server";

import { db } from "@/lib/db";
import { anunciantes } from "@/lib/db/schema";
import type { CategoriaAnunciante, PlanAnunciante } from "@/types/supabase";

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function registrarNegocio(
  formData: FormData
): Promise<{ error?: string }> {
  const nombreNegocio = (formData.get("nombre_negocio") as string | null)?.trim() ?? "";
  const categoria = (formData.get("categoria") as string | null) ?? "";
  const zona = (formData.get("zona") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const telefono = (formData.get("telefono") as string | null)?.trim() || null;
  const whatsapp = (formData.get("whatsapp") as string | null)?.trim() || null;
  const web = (formData.get("web") as string | null)?.trim() || null;
  const plan = (formData.get("plan") as string | null) ?? "basico";
  const descEs = (formData.get("descripcion_es") as string | null)?.trim() || null;

  if (!nombreNegocio) return { error: "El nombre del negocio es obligatorio." };
  if (!email) return { error: "El email de contacto es obligatorio." };
  if (!categoria) return { error: "Selecciona una categoría." };

  const slug = `${toSlug(nombreNegocio)}-${Date.now().toString(36)}`;

  try {
    await db.insert(anunciantes).values({
      nombreNegocio,
      slug,
      categoria: categoria as CategoriaAnunciante,
      zona,
      email,
      telefono,
      whatsapp,
      web,
      plan: plan as PlanAnunciante,
      descripcion: descEs ? { es: descEs } : null,
      activo: false,
    });
  } catch (e) {
    console.error("registrarNegocio:", e);
    return { error: "No se pudo registrar el negocio. Inténtalo de nuevo." };
  }
  return {};
}
