'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function enviarSolicitudAcompanante(
  formData: FormData,
): Promise<{ error?: string }> {
  const nombre  = (formData.get('nombre')  as string | null)?.trim() ?? '';
  const email   = (formData.get('email')   as string | null)?.trim() ?? '';
  const telefono = (formData.get('telefono') as string | null)?.trim() || null;
  const zona    = (formData.get('zona')    as string | null)?.trim() || null;
  const mensaje = (formData.get('mensaje') as string | null)?.trim() || null;
  const idiomas = formData.getAll('idioma').map(String).filter(Boolean);

  if (!nombre) return { error: 'El nombre es obligatorio.' };
  if (!email || !email.includes('@')) return { error: 'El email no es válido.' };

  const admin = createAdminClient() as SupabaseClient;
  const { error } = await (admin as SupabaseClient)
    .from('solicitudes_acompanante')
    .insert({ nombre, email, telefono, idiomas, zona, mensaje });

  if (error) return { error: error.message };
  return {};
}
