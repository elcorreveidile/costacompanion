'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Usamos SupabaseClient sin genérico para operaciones DML con JSONB y arrays
type RawClient = SupabaseClient;

// ── Helpers de slug ───────────────────────────────────────────────────────────

function generarSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // quita caracteres no alfanuméricos excepto espacios
    .trim()
    .replace(/\s+/g, '-') // espacios → guiones
    .replace(/-{2,}/g, '-'); // guiones dobles → uno
}

async function ensureUniqueSlug(
  admin: RawClient,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    let query = admin
      .from('acompanantes')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.maybeSingle();

    if (!data) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ── Server Actions ────────────────────────────────────────────────────────────

export async function crearAcompanante(
  formData: FormData
): Promise<{ error?: string }> {
  const admin = createAdminClient() as RawClient;

  const email = (formData.get('email') as string | null)?.trim();
  const nombre_publico = (formData.get('nombre_publico') as string | null)?.trim();
  const slugInput = (formData.get('slug') as string | null)?.trim();

  if (!email || !nombre_publico) {
    return { error: 'Email y nombre son obligatorios.' };
  }

  try {
    // 1. Crear usuario en Auth (el trigger SQL crea el profile automáticamente con rol='cliente')
    const { data: authData, error: authError } = await (createAdminClient()).auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      return { error: authError?.message ?? 'Error creando usuario en Auth.' };
    }

    const userId = authData.user.id;

    // 2. Actualizar profile: rol='acompanante', nombre=nombre_publico
    const { error: profileError } = await admin
      .from('profiles')
      .update({ rol: 'acompanante', nombre: nombre_publico })
      .eq('id', userId);

    if (profileError) {
      return { error: profileError.message };
    }

    // 3. Generar slug único
    const baseSlug = slugInput ? generarSlug(slugInput) : generarSlug(nombre_publico);
    const slug = await ensureUniqueSlug(admin, baseSlug);

    // 4. Insertar en acompanantes
    const { error: insertError } = await admin.from('acompanantes').insert({
      profile_id: userId,
      slug,
      nombre_publico,
      email_contacto: email,
      idiomas: [],
      zonas: [],
      modalidades: [],
    });

    if (insertError) {
      return { error: insertError.message };
    }

    revalidatePath('/admin/acompanantes');
    return {};
  } catch (err) {
    console.error('crearAcompanante error:', err);
    return { error: 'Error inesperado al crear el acompañante.' };
  }
}

export async function actualizarAcompanante(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const admin = createAdminClient() as RawClient;

  try {
    // Leer slug actual para revalidar el microsite
    const { data: current } = await admin
      .from('acompanantes')
      .select('slug')
      .eq('id', id)
      .single() as { data: { slug: string } | null; error: null };

    const idiomas = (formData.getAll('idiomas') as string[]).filter(Boolean);
    const zonas = (formData.getAll('zonas') as string[]).filter(Boolean);
    const modalidades = (formData.getAll('modalidades') as string[]).filter(Boolean);

    const bio = {
      es: (formData.get('bio_es') as string | null) ?? '',
      en: (formData.get('bio_en') as string | null) ?? '',
    };

    const anios_raw = formData.get('anios_experiencia');
    const anios_experiencia = anios_raw ? (Number(anios_raw) || null) : null;

    const { error } = await admin
      .from('acompanantes')
      .update({
        nombre_publico: (formData.get('nombre_publico') as string | null) ?? '',
        foto_url: (formData.get('foto_url') as string | null) || null,
        bio,
        idiomas,
        zonas,
        modalidades,
        email_contacto: (formData.get('email_contacto') as string | null) || null,
        whatsapp: (formData.get('whatsapp') as string | null) || null,
        titulacion: (formData.get('titulacion') as string | null) || null,
        interprete_jurado: formData.get('interprete_jurado') === 'on',
        anios_experiencia,
        imparte_clases: formData.get('imparte_clases') === 'on',
        activo: formData.get('activo') === 'on',
        destacado: formData.get('destacado') === 'on',
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/acompanantes');
    revalidatePath(`/admin/acompanantes/${id}`);
    if (current?.slug) {
      revalidatePath(`/${current.slug}`);
    }

    return {};
  } catch (err) {
    console.error('actualizarAcompanante error:', err);
    return { error: 'Error inesperado al actualizar el acompañante.' };
  }
}

export async function toggleActivo(
  id: string,
  activo: boolean
): Promise<void> {
  const admin = createAdminClient() as RawClient;

  await admin.from('acompanantes').update({ activo }).eq('id', id);

  revalidatePath('/admin/acompanantes');
  revalidatePath('/directorio');
}

export async function toggleDestacado(
  id: string,
  destacado: boolean
): Promise<void> {
  const admin = createAdminClient() as RawClient;

  await admin.from('acompanantes').update({ destacado }).eq('id', id);

  revalidatePath('/admin/acompanantes');
}
