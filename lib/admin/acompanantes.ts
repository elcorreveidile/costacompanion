"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { profiles, acompanantes } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

type Modalidad = "presencial" | "remoto" | "ambos";

export interface AltaResult {
  error?: string;
  numeroUsuario?: string;
  pin?: string;
}

async function requireSuperadmin(): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  return { ok: user?.rol === "superadmin" };
}

// ── Helpers de slug / credenciales ────────────────────────────────────────────

function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-");
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || "acompanante";
  let counter = 2;
  while (true) {
    const [row] = await db
      .select({ id: acompanantes.id })
      .from(acompanantes)
      .where(eq(acompanantes.slug, slug))
      .limit(1);
    if (!row) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function pin6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function numeroUnico(): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const n = pin6();
    const [row] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.numeroUsuario, n))
      .limit(1);
    if (!row) return n;
  }
  throw new Error("No se pudo generar un número de usuario único.");
}

// ── Server Actions ────────────────────────────────────────────────────────────

export async function crearAcompanante(formData: FormData): Promise<AltaResult> {
  if (!(await requireSuperadmin()).ok) return { error: "No autorizado." };

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const nombrePublico = (formData.get("nombre_publico") as string | null)?.trim();
  const slugInput = (formData.get("slug") as string | null)?.trim();

  if (!email || !nombrePublico) {
    return { error: "Email y nombre son obligatorios." };
  }

  try {
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    if (existing) {
      return {
        error:
          'Ya existe un usuario con ese email. Usa "asignar acompañante existente".',
      };
    }

    const numero = await numeroUnico();
    const pin = pin6();
    const pinHash = await bcrypt.hash(pin, 10);

    const [prof] = await db
      .insert(profiles)
      .values({
        rol: "acompanante",
        nombre: nombrePublico,
        name: nombrePublico,
        email,
        emailVerified: new Date(),
        idiomaPreferido: "es",
        numeroUsuario: numero,
        pinHash,
      })
      .returning({ id: profiles.id });

    const baseSlug = generarSlug(slugInput || nombrePublico);
    const slug = await ensureUniqueSlug(baseSlug);

    await db.insert(acompanantes).values({
      profileId: prof.id,
      slug,
      nombrePublico,
      emailContacto: email,
    });

    revalidatePath("/admin/acompanantes");
    return { numeroUsuario: numero, pin };
  } catch (err) {
    console.error("crearAcompanante:", err);
    return { error: "Error inesperado al crear el acompañante." };
  }
}

export async function actualizarAcompanante(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin()).ok) return { error: "No autorizado." };

  try {
    const [current] = await db
      .select({ slug: acompanantes.slug })
      .from(acompanantes)
      .where(eq(acompanantes.id, id))
      .limit(1);

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
        activo: formData.get("activo") === "on",
        destacado: formData.get("destacado") === "on",
      })
      .where(eq(acompanantes.id, id));

    revalidatePath("/admin/acompanantes");
    revalidatePath(`/admin/acompanantes/${id}`);
    if (current?.slug) revalidatePath(`/${current.slug}`);
    return {};
  } catch (err) {
    console.error("actualizarAcompanante:", err);
    return { error: "Error inesperado al actualizar el acompañante." };
  }
}

export async function toggleActivo(id: string, activo: boolean): Promise<void> {
  if (!(await requireSuperadmin()).ok) return;
  await db.update(acompanantes).set({ activo }).where(eq(acompanantes.id, id));
  revalidatePath("/admin/acompanantes");
  revalidatePath("/directorio");
}

export async function toggleDestacado(
  id: string,
  destacado: boolean
): Promise<void> {
  if (!(await requireSuperadmin()).ok) return;
  await db.update(acompanantes).set({ destacado }).where(eq(acompanantes.id, id));
  revalidatePath("/admin/acompanantes");
}

/** Reinicia el PIN de un acompañante (genera uno nuevo) y lo devuelve. */
export async function resetPinAcompanante(profileId: string): Promise<AltaResult> {
  if (!(await requireSuperadmin()).ok) return { error: "No autorizado." };
  const pin = pin6();
  const pinHash = await bcrypt.hash(pin, 10);
  const [prof] = await db
    .select({ numeroUsuario: profiles.numeroUsuario })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);
  let numero = prof?.numeroUsuario ?? null;
  if (!numero) numero = await numeroUnico();
  await db
    .update(profiles)
    .set({ pinHash, numeroUsuario: numero, pinIntentos: 0, pinBloqueadoHasta: null })
    .where(eq(profiles.id, profileId));
  revalidatePath("/admin/acompanantes");
  return { numeroUsuario: numero, pin };
}

/**
 * Reinicia (o asigna) el número de usuario + PIN de OTRA cuenta superadmin.
 * Solo un superadmin puede hacerlo, y solo sobre perfiles con rol superadmin.
 */
export async function resetPinSuperadmin(profileId: string): Promise<AltaResult> {
  if (!(await requireSuperadmin()).ok) return { error: "No autorizado." };
  const [target] = await db
    .select({ rol: profiles.rol, numeroUsuario: profiles.numeroUsuario })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);
  if (!target) return { error: "No se encontró el perfil." };
  if (target.rol !== "superadmin") {
    return { error: "Solo se puede reiniciar el PIN de cuentas superadmin desde aquí." };
  }
  const pin = pin6();
  const pinHash = await bcrypt.hash(pin, 10);
  const numero = target.numeroUsuario ?? (await numeroUnico());
  await db
    .update(profiles)
    .set({ pinHash, numeroUsuario: numero, pinIntentos: 0, pinBloqueadoHasta: null })
    .where(eq(profiles.id, profileId));
  revalidatePath("/admin/equipo");
  return { numeroUsuario: numero, pin };
}

export async function asignarAcompananteExistente(
  formData: FormData
): Promise<AltaResult> {
  if (!(await requireSuperadmin()).ok) return { error: "No autorizado." };

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const nombrePublico = (formData.get("nombre_publico") as string | null)?.trim();
  const slugInput = (formData.get("slug") as string | null)?.trim();

  if (!email || !nombrePublico) {
    return { error: "Email y nombre son obligatorios." };
  }

  try {
    const [user] = await db
      .select({
        id: profiles.id,
        numeroUsuario: profiles.numeroUsuario,
        pinHash: profiles.pinHash,
      })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!user) {
      return { error: `No existe ningún usuario registrado con el email "${email}".` };
    }

    const [existingFicha] = await db
      .select({ id: acompanantes.id })
      .from(acompanantes)
      .where(eq(acompanantes.profileId, user.id))
      .limit(1);
    if (existingFicha) {
      return { error: "Este usuario ya tiene una ficha de acompañante." };
    }

    // Rol acompañante + credenciales de PIN si aún no tiene.
    let numero = user.numeroUsuario;
    let pinPlano: string | undefined;
    let pinHash = user.pinHash;
    if (!numero) numero = await numeroUnico();
    if (!pinHash) {
      pinPlano = pin6();
      pinHash = await bcrypt.hash(pinPlano, 10);
    }

    await db
      .update(profiles)
      .set({ rol: "acompanante", nombre: nombrePublico, numeroUsuario: numero, pinHash })
      .where(eq(profiles.id, user.id));

    const baseSlug = generarSlug(slugInput || nombrePublico);
    const slug = await ensureUniqueSlug(baseSlug);

    await db.insert(acompanantes).values({
      profileId: user.id,
      slug,
      nombrePublico,
      emailContacto: email,
    });

    revalidatePath("/admin/acompanantes");
    return { numeroUsuario: numero ?? undefined, pin: pinPlano };
  } catch (err) {
    console.error("asignarAcompananteExistente:", err);
    return { error: "Error inesperado al asignar el acompañante." };
  }
}

// ── Subida de foto (admin) ────────────────────────────────────────────────────

const FOTO_TIPOS_ADMIN = ["image/jpeg", "image/png", "image/webp"];
const FOTO_MAX_BYTES_ADMIN = 5 * 1024 * 1024; // 5 MB

/**
 * Sube una foto de perfil para CUALQUIER acompañante (solo superadmin).
 * Recibe el fichero en `foto` y el id del acompañante en `acompanante_id`.
 * Actualiza la ficha y devuelve la URL pública del blob.
 */
export async function subirFotoAcompananteAdmin(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const { ok } = await requireSuperadmin();
  if (!ok) return { error: "No autorizado." };

  const acompananteId = (formData.get("acompanante_id") as string | null) ?? "";
  if (!acompananteId) return { error: "Falta el identificador del acompañante." };

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No se recibió ninguna imagen." };
  }
  if (!FOTO_TIPOS_ADMIN.includes(file.type)) {
    return { error: "Formato no válido. Usa JPG, PNG o WEBP." };
  }
  if (file.size > FOTO_MAX_BYTES_ADMIN) {
    return { error: "La imagen supera el máximo de 5 MB." };
  }

  try {
    const { put } = await import("@vercel/blob");
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`acompanantes/${acompananteId}/${Date.now()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
    });

    await db
      .update(acompanantes)
      .set({ fotoUrl: blob.url })
      .where(eq(acompanantes.id, acompananteId));

    revalidatePath(`/admin/acompanantes/${acompananteId}`);
    return { url: blob.url };
  } catch (e) {
    console.error("subirFotoAcompananteAdmin:", e);
    return { error: "No se pudo subir la imagen. Inténtalo de nuevo." };
  }
}
