'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Usamos un cliente sin tipado genérico para las operaciones DML que tienen
// payloads con JSONB y arrays, que el tipo Partial<T> no cubre bien.
type RawClient = SupabaseClient;

// ── Helper: obtener acompanante_id del usuario autenticado ────────────────────

async function getAcompananteId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const { data } = await supabase.rpc('mi_acompanante_id');
  return data ?? null;
}

// ── Server Actions ────────────────────────────────────────────────────────────

export async function actualizarFicha(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const acompananteId = await getAcompananteId(supabase);
  if (!acompananteId) {
    return { error: 'No se encontró tu ficha de acompañante.' };
  }

  const idiomas = (formData.getAll('idiomas') as string[]).filter(Boolean);
  const zonas = (formData.getAll('zonas') as string[]).filter(Boolean);
  const modalidades = (formData.getAll('modalidades') as string[]).filter(Boolean);

  const bio = {
    es: (formData.get('bio_es') as string | null) ?? '',
    en: (formData.get('bio_en') as string | null) ?? '',
  };

  const anios_raw = formData.get('anios_experiencia');
  const anios_experiencia = anios_raw ? (Number(anios_raw) || null) : null;

  const { error } = await (supabase as RawClient)
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
    })
    .eq('id', acompananteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/ficha');
  return {};
}

export async function crearServicio(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const acompananteId = await getAcompananteId(supabase);
  if (!acompananteId) {
    return { error: 'No se encontró tu ficha de acompañante.' };
  }

  const titulo = {
    es: (formData.get('titulo_es') as string | null) ?? '',
    en: (formData.get('titulo_en') as string | null) ?? '',
  };

  const descripcion = {
    es: (formData.get('descripcion_es') as string | null) ?? '',
    en: (formData.get('descripcion_en') as string | null) ?? '',
  };

  const precio = Number(formData.get('precio')) || 0;

  const { error } = await (supabase as RawClient).from('servicios').insert({
    acompanante_id: acompananteId,
    categoria: formData.get('categoria') as string,
    titulo,
    descripcion,
    modalidad: formData.get('modalidad') as string,
    precio,
    unidad_precio: formData.get('unidad_precio') as string,
    es_clase: formData.get('es_clase') === 'on',
    activo: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/servicios');
  return {};
}

export async function actualizarServicio(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const titulo = {
    es: (formData.get('titulo_es') as string | null) ?? '',
    en: (formData.get('titulo_en') as string | null) ?? '',
  };

  const descripcion = {
    es: (formData.get('descripcion_es') as string | null) ?? '',
    en: (formData.get('descripcion_en') as string | null) ?? '',
  };

  const precio = Number(formData.get('precio')) || 0;

  const { error } = await (supabase as RawClient)
    .from('servicios')
    .update({
      categoria: formData.get('categoria') as string,
      titulo,
      descripcion,
      modalidad: formData.get('modalidad') as string,
      precio,
      unidad_precio: formData.get('unidad_precio') as string,
      es_clase: formData.get('es_clase') === 'on',
    })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/servicios');
  return {};
}

export async function eliminarServicio(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await (supabase as RawClient).from('servicios').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/servicios');
  return {};
}

export async function crearPaquete(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await (supabase as RawClient).from('paquetes_clases').insert({
    servicio_id: formData.get('servicio_id') as string,
    num_sesiones: Number(formData.get('num_sesiones')) || 1,
    precio_total: Number(formData.get('precio_total')) || 0,
    activo: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/servicios');
  return {};
}

export async function eliminarPaquete(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await (supabase as RawClient).from('paquetes_clases').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/servicios');
  return {};
}

export async function crearDisponibilidad(data: {
  fechaHora: string;
  duracionMin: number;
  modalidad: string;
  zona: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();

  const acompananteId = await getAcompananteId(supabase);
  if (!acompananteId) {
    return { error: 'No se encontró tu ficha de acompañante.' };
  }

  const { error } = await (supabase as RawClient).from('disponibilidad').insert({
    acompanante_id: acompananteId,
    fecha_hora: data.fechaHora,
    duracion_min: data.duracionMin,
    modalidad: data.modalidad,
    zona: data.zona || null,
    estado: 'abierto',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/disponibilidad');
  return {};
}

export async function eliminarDisponibilidad(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await (supabase as RawClient).from('disponibilidad').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/acompanante/disponibilidad');
  return {};
}

// ── Subida de foto de perfil ──────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = 'fotos-acompanantes';

export async function subirFotoAcompanante(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const acompananteId = await getAcompananteId(supabase);
  if (!acompananteId) return { error: 'No se encontró tu ficha de acompañante.' };

  const file = formData.get('foto') as File | null;
  if (!file || file.size === 0) return { error: 'No se seleccionó ninguna imagen.' };
  if (file.size > MAX_BYTES) return { error: 'La imagen no puede superar 5 MB.' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Formato no permitido. Usa JPG, PNG o WEBP.' };
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${acompananteId}.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Cache-bust so the browser fetches the new image
  const url = `${publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await (supabase as RawClient)
    .from('acompanantes')
    .update({ foto_url: publicUrl })
    .eq('id', acompananteId);

  if (dbError) return { error: dbError.message };

  revalidatePath('/acompanante/ficha');
  return { url };
}
