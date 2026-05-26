'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

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

async function ensureUniqueSlug(
  admin: RawClient,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;
  while (true) {
    let query = admin.from('anunciantes').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function crearAnunciante(
  formData: FormData
): Promise<{ error?: string }> {
  const admin = createAdminClient() as RawClient;

  const email         = (formData.get('email') as string | null)?.trim();
  const nombre_negocio = (formData.get('nombre_negocio') as string | null)?.trim();
  const slugInput     = (formData.get('slug') as string | null)?.trim();
  const categoria     = (formData.get('categoria') as string | null)?.trim();
  const zona          = (formData.get('zona') as string | null)?.trim() || null;
  const plan          = (formData.get('plan') as string | null)?.trim() || 'basico';

  if (!email || !nombre_negocio || !categoria) {
    return { error: 'Email, nombre del negocio y categoría son obligatorios.' };
  }

  try {
    const { data: authData, error: authError } = await createAdminClient().auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (authError || !authData?.user) {
      return { error: authError?.message ?? 'Error creando usuario en Auth.' };
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        { id: userId, rol: 'anunciante', nombre: nombre_negocio, idioma_preferido: 'es' },
        { onConflict: 'id' }
      );
    if (profileError) return { error: profileError.message };

    const baseSlug = slugInput ? generarSlug(slugInput) : generarSlug(nombre_negocio);
    const slug = await ensureUniqueSlug(admin, baseSlug);

    const { error: insertError } = await admin.from('anunciantes').insert({
      profile_id: userId,
      slug,
      nombre_negocio,
      categoria,
      zona,
      plan,
      email,
    });
    if (insertError) return { error: insertError.message };

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
  const admin = createAdminClient() as RawClient;

  const email         = (formData.get('email') as string | null)?.trim().toLowerCase();
  const nombre_negocio = (formData.get('nombre_negocio') as string | null)?.trim();
  const slugInput     = (formData.get('slug') as string | null)?.trim();
  const categoria     = (formData.get('categoria') as string | null)?.trim();
  const zona          = (formData.get('zona') as string | null)?.trim() || null;
  const plan          = (formData.get('plan') as string | null)?.trim() || 'basico';

  if (!email || !nombre_negocio || !categoria) {
    return { error: 'Email, nombre del negocio y categoría son obligatorios.' };
  }

  try {
    const { data: listData, error: listError } = await createAdminClient().auth.admin.listUsers({
      page: 1, perPage: 1000,
    });
    if (listError) return { error: listError.message };

    const authUser = listData.users.find((u) => u.email?.toLowerCase() === email);
    if (!authUser) {
      return { error: `No existe ningún usuario registrado con el email "${email}".` };
    }

    const userId = authUser.id;

    const { data: existing } = await admin
      .from('anunciantes').select('id').eq('profile_id', userId).maybeSingle();
    if (existing) return { error: 'Este usuario ya tiene una ficha de anunciante.' };

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        { id: userId, rol: 'anunciante', nombre: nombre_negocio, idioma_preferido: 'es' },
        { onConflict: 'id' }
      );
    if (profileError) return { error: profileError.message };

    const baseSlug = slugInput ? generarSlug(slugInput) : generarSlug(nombre_negocio);
    const slug = await ensureUniqueSlug(admin, baseSlug);

    const { error: insertError } = await admin.from('anunciantes').insert({
      profile_id: userId,
      slug,
      nombre_negocio,
      categoria,
      zona,
      plan,
      email,
    });
    if (insertError) return { error: insertError.message };

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
  const admin = createAdminClient() as RawClient;

  try {
    const descripcion = {
      es: (formData.get('descripcion_es') as string | null) ?? '',
      en: (formData.get('descripcion_en') as string | null) ?? '',
    };

    const { error } = await admin
      .from('anunciantes')
      .update({
        nombre_negocio: (formData.get('nombre_negocio') as string | null) ?? '',
        logo_url:       (formData.get('logo_url') as string | null) || null,
        descripcion,
        web:            (formData.get('web') as string | null) || null,
        telefono:       (formData.get('telefono') as string | null) || null,
        email:          (formData.get('email') as string | null) || null,
        whatsapp:       (formData.get('whatsapp') as string | null) || null,
        zona:      (formData.get('zona') as string | null) || null,
        direccion: (formData.get('direccion') as string | null) || null,
        categoria: (formData.get('categoria') as string | null) ?? '',
        plan:      (formData.get('plan') as string | null) ?? 'basico',
        activo:    formData.get('activo') === 'on',
      })
      .eq('id', id);

    if (error) return { error: error.message };

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
  const admin = createAdminClient() as RawClient;
  await admin.from('anunciantes').update({ activo }).eq('id', id);
  revalidatePath('/admin/anunciantes');
  revalidatePath('/local-partners');
}
