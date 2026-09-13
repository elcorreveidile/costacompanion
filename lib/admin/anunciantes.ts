'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profiles, anunciantes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import type { CategoriaAnunciante, PlanAnunciante } from '@/types/supabase';
import { locales } from '@/lib/i18n/config';

async function requireSuperadmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.rol === 'superadmin';
}

function generarSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug || 'negocio';
  let counter = 2;
  while (true) {
    const [row] = await db
      .select({ id: anunciantes.id })
      .from(anunciantes)
      .where(
        excludeId
          ? and(eq(anunciantes.slug, slug), ne(anunciantes.id, excludeId))
          : eq(anunciantes.slug, slug)
      )
      .limit(1);
    if (!row) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function crearAnunciante(
  formData: FormData
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };

  const email          = (formData.get('email') as string | null)?.trim().toLowerCase();
  const nombre_negocio = (formData.get('nombre_negocio') as string | null)?.trim();
  const slugInput      = (formData.get('slug') as string | null)?.trim();
  const categoria      = (formData.get('categoria') as string | null)?.trim();
  const zona           = (formData.get('zona') as string | null)?.trim() || null;
  const plan           = (formData.get('plan') as string | null)?.trim() || 'basico';

  if (!email || !nombre_negocio || !categoria) {
    return { error: 'Email, nombre del negocio y categoría son obligatorios.' };
  }

  try {
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    if (existing) {
      return {
        error: 'Ya existe un usuario con ese email. Usa "asignar anunciante existente".',
      };
    }

    const [prof] = await db
      .insert(profiles)
      .values({
        rol: 'anunciante',
        nombre: nombre_negocio,
        name: nombre_negocio,
        email,
        emailVerified: new Date(),
        idiomaPreferido: 'es',
      })
      .returning({ id: profiles.id });

    const baseSlug = generarSlug(slugInput || nombre_negocio);
    const slug = await ensureUniqueSlug(baseSlug);

    await db.insert(anunciantes).values({
      profileId: prof.id,
      slug,
      nombreNegocio: nombre_negocio,
      categoria: categoria as CategoriaAnunciante,
      zona,
      plan: plan as PlanAnunciante,
      email,
    });

    revalidatePath('/admin/anunciantes');
    return {};
  } catch (err) {
    console.error('crearAnunciante error:', err);
    return { error: 'Error inesperado al crear el anunciante.' };
  }
}

export async function asignarAnuncianteExistente(
  formData: FormData
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };

  const email          = (formData.get('email') as string | null)?.trim().toLowerCase();
  const nombre_negocio = (formData.get('nombre_negocio') as string | null)?.trim();
  const slugInput      = (formData.get('slug') as string | null)?.trim();
  const categoria      = (formData.get('categoria') as string | null)?.trim();
  const zona           = (formData.get('zona') as string | null)?.trim() || null;
  const plan           = (formData.get('plan') as string | null)?.trim() || 'basico';

  if (!email || !nombre_negocio || !categoria) {
    return { error: 'Email, nombre del negocio y categoría son obligatorios.' };
  }

  try {
    const [user] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    if (!user) {
      return { error: `No existe ningún usuario registrado con el email "${email}".` };
    }

    const [existing] = await db
      .select({ id: anunciantes.id })
      .from(anunciantes)
      .where(eq(anunciantes.profileId, user.id))
      .limit(1);
    if (existing) return { error: 'Este usuario ya tiene una ficha de anunciante.' };

    await db
      .update(profiles)
      .set({ rol: 'anunciante', nombre: nombre_negocio })
      .where(eq(profiles.id, user.id));

    const baseSlug = generarSlug(slugInput || nombre_negocio);
    const slug = await ensureUniqueSlug(baseSlug);

    await db.insert(anunciantes).values({
      profileId: user.id,
      slug,
      nombreNegocio: nombre_negocio,
      categoria: categoria as CategoriaAnunciante,
      zona,
      plan: plan as PlanAnunciante,
      email,
    });

    revalidatePath('/admin/anunciantes');
    return {};
  } catch (err) {
    console.error('asignarAnuncianteExistente error:', err);
    return { error: 'Error inesperado al asignar el anunciante.' };
  }
}

export async function actualizarAnunciante(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  if (!(await requireSuperadmin())) return { error: 'No autorizado.' };

  try {
    const descripcion: Record<string, string> = {};
    for (const code of locales) {
      const v = ((formData.get(`descripcion_${code}`) as string | null) ?? '').trim();
      if (v) descripcion[code] = v;
    }

    await db
      .update(anunciantes)
      .set({
        nombreNegocio: (formData.get('nombre_negocio') as string | null) ?? '',
        logoUrl:       (formData.get('logo_url') as string | null) || null,
        descripcion,
        web:           (formData.get('web') as string | null) || null,
        telefono:      (formData.get('telefono') as string | null) || null,
        email:         (formData.get('email') as string | null) || null,
        whatsapp:      (formData.get('whatsapp') as string | null) || null,
        zona:          (formData.get('zona') as string | null) || null,
        direccion:     (formData.get('direccion') as string | null) || null,
        categoria:     ((formData.get('categoria') as string | null) ?? '') as CategoriaAnunciante,
        plan:          ((formData.get('plan') as string | null) ?? 'basico') as PlanAnunciante,
        activo:        formData.get('activo') === 'on',
      })
      .where(eq(anunciantes.id, id));

    revalidatePath('/admin/anunciantes');
    revalidatePath(`/admin/anunciantes/${id}`);
    revalidatePath('/local-partners');
    return {};
  } catch (err) {
    console.error('actualizarAnunciante error:', err);
    return { error: 'Error inesperado al actualizar el anunciante.' };
  }
}

export async function toggleActivoAnunciante(
  id: string,
  activo: boolean
): Promise<void> {
  if (!(await requireSuperadmin())) return;
  await db.update(anunciantes).set({ activo }).where(eq(anunciantes.id, id));
  revalidatePath('/admin/anunciantes');
  revalidatePath('/local-partners');
}
