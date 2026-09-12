"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes,
  servicios,
  paquetesClases,
  disponibilidad,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

type Modalidad = "presencial" | "remoto" | "ambos";
type UnidadPrecio = "hora" | "servicio" | "sesion";

/**
 * ID del acompañante del usuario autenticado (sustituye a la RPC
 * mi_acompanante_id() de Supabase). Toda escritura se acota por este id, que es
 * la comprobación de propiedad que antes garantizaba la RLS.
 */
async function getMiAcompananteId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const [row] = await db
    .select({ id: acompanantes.id })
    .from(acompanantes)
    .where(eq(acompanantes.profileId, user.id))
    .limit(1);
  return row?.id ?? null;
}

export async function actualizarFicha(
  formData: FormData
): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  const idiomas = (formData.getAll("idiomas") as string[]).filter(Boolean);
  const zonas = (formData.getAll("zonas") as string[]).filter(Boolean);
  const modalidades = (formData.getAll("modalidades") as string[]).filter(
    Boolean
  ) as Modalidad[];

  const bio = {
    es: (formData.get("bio_es") as string | null) ?? "",
    en: (formData.get("bio_en") as string | null) ?? "",
  };

  const aniosRaw = formData.get("anios_experiencia");
  const aniosExperiencia = aniosRaw ? Number(aniosRaw) || null : null;

  try {
    await db
      .update(acompanantes)
      .set({
        nombrePublico: (formData.get("nombre_publico") as string | null) ?? "",
        fotoUrl: (formData.get("foto_url") as string | null) || null,
        bio,
        idiomas,
        zonas,
        modalidades,
        emailContacto: (formData.get("email_contacto") as string | null) || null,
        whatsapp: (formData.get("whatsapp") as string | null) || null,
        titulacion: (formData.get("titulacion") as string | null) || null,
        interpreteJurado: formData.get("interprete_jurado") === "on",
        aniosExperiencia,
        imparteClases: formData.get("imparte_clases") === "on",
      })
      .where(eq(acompanantes.id, acompananteId));
  } catch (e) {
    console.error("actualizarFicha:", e);
    return { error: "No se pudo actualizar la ficha." };
  }

  revalidatePath("/acompanante/ficha");
  return {};
}

export async function crearServicio(
  formData: FormData
): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  const titulo = {
    es: (formData.get("titulo_es") as string | null) ?? "",
    en: (formData.get("titulo_en") as string | null) ?? "",
  };
  const descripcion = {
    es: (formData.get("descripcion_es") as string | null) ?? "",
    en: (formData.get("descripcion_en") as string | null) ?? "",
  };
  const precio = Number(formData.get("precio")) || 0;

  try {
    await db.insert(servicios).values({
      acompananteId,
      categoria: formData.get("categoria") as string,
      titulo,
      descripcion,
      modalidad: formData.get("modalidad") as Modalidad,
      precio: precio.toString(),
      unidadPrecio: formData.get("unidad_precio") as UnidadPrecio,
      esClase: formData.get("es_clase") === "on",
      activo: true,
    });
  } catch (e) {
    console.error("crearServicio:", e);
    return { error: "No se pudo crear el servicio." };
  }

  revalidatePath("/acompanante/servicios");
  return {};
}

export async function actualizarServicio(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  const titulo = {
    es: (formData.get("titulo_es") as string | null) ?? "",
    en: (formData.get("titulo_en") as string | null) ?? "",
  };
  const descripcion = {
    es: (formData.get("descripcion_es") as string | null) ?? "",
    en: (formData.get("descripcion_en") as string | null) ?? "",
  };
  const precio = Number(formData.get("precio")) || 0;

  try {
    await db
      .update(servicios)
      .set({
        categoria: formData.get("categoria") as string,
        titulo,
        descripcion,
        modalidad: formData.get("modalidad") as Modalidad,
        precio: precio.toString(),
        unidadPrecio: formData.get("unidad_precio") as UnidadPrecio,
        esClase: formData.get("es_clase") === "on",
      })
      // acota por propiedad: solo servicios del propio acompañante
      .where(and(eq(servicios.id, id), eq(servicios.acompananteId, acompananteId)));
  } catch (e) {
    console.error("actualizarServicio:", e);
    return { error: "No se pudo actualizar el servicio." };
  }

  revalidatePath("/acompanante/servicios");
  return {};
}

export async function eliminarServicio(id: string): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  try {
    await db
      .delete(servicios)
      .where(and(eq(servicios.id, id), eq(servicios.acompananteId, acompananteId)));
  } catch (e) {
    console.error("eliminarServicio:", e);
    return { error: "No se pudo eliminar el servicio." };
  }

  revalidatePath("/acompanante/servicios");
  return {};
}

export async function crearPaquete(
  formData: FormData
): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  const servicioId = formData.get("servicio_id") as string;

  // Verifica que el servicio pertenece al acompañante.
  const [srv] = await db
    .select({ id: servicios.id })
    .from(servicios)
    .where(and(eq(servicios.id, servicioId), eq(servicios.acompananteId, acompananteId)))
    .limit(1);
  if (!srv) return { error: "Servicio no encontrado." };

  try {
    await db.insert(paquetesClases).values({
      servicioId,
      numSesiones: Number(formData.get("num_sesiones")) || 1,
      precioTotal: (Number(formData.get("precio_total")) || 0).toString(),
      activo: true,
    });
  } catch (e) {
    console.error("crearPaquete:", e);
    return { error: "No se pudo crear el paquete." };
  }

  revalidatePath("/acompanante/servicios");
  return {};
}

export async function eliminarPaquete(id: string): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  const misServicios = db
    .select({ id: servicios.id })
    .from(servicios)
    .where(eq(servicios.acompananteId, acompananteId));

  try {
    await db
      .delete(paquetesClases)
      .where(
        and(eq(paquetesClases.id, id), inArray(paquetesClases.servicioId, misServicios))
      );
  } catch (e) {
    console.error("eliminarPaquete:", e);
    return { error: "No se pudo eliminar el paquete." };
  }

  revalidatePath("/acompanante/servicios");
  return {};
}

export async function crearDisponibilidad(data: {
  fechaHora: string;
  duracionMin: number;
  modalidad: string;
  zona: string;
}): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  try {
    await db.insert(disponibilidad).values({
      acompananteId,
      fechaHora: new Date(data.fechaHora),
      duracionMin: data.duracionMin,
      modalidad: data.modalidad as Modalidad,
      zona: data.zona || null,
      estado: "abierto",
    });
  } catch (e) {
    console.error("crearDisponibilidad:", e);
    return { error: "No se pudo crear la disponibilidad." };
  }

  revalidatePath("/acompanante/disponibilidad");
  return {};
}

export async function eliminarDisponibilidad(
  id: string
): Promise<{ error?: string }> {
  const acompananteId = await getMiAcompananteId();
  if (!acompananteId) return { error: "No se encontró tu ficha de acompañante." };

  try {
    await db
      .delete(disponibilidad)
      .where(
        and(eq(disponibilidad.id, id), eq(disponibilidad.acompananteId, acompananteId))
      );
  } catch (e) {
    console.error("eliminarDisponibilidad:", e);
    return { error: "No se pudo eliminar la disponibilidad." };
  }

  revalidatePath("/acompanante/disponibilidad");
  return {};
}

// ── Subida de foto de perfil ──────────────────────────────────────────────────
// Pendiente de migrar a Vercel Blob (Fase 3). De momento deshabilitada para no
// depender del storage de Supabase.

export async function subirFotoAcompanante(
  _formData: FormData
): Promise<{ url?: string; error?: string }> {
  return {
    error:
      "La subida de foto estará disponible en breve (migración de almacenamiento en curso).",
  };
}
