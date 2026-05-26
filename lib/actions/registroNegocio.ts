'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function registrarNegocio(
  formData: FormData,
): Promise<{ error?: string }> {
  const nombre_negocio = (formData.get('nombre_negocio') as string | null)?.trim() ?? '';
  const categoria      = (formData.get('categoria')      as string | null) ?? '';
  const zona           = (formData.get('zona')           as string | null)?.trim() || null;
  const email          = (formData.get('email')          as string | null)?.trim() || null;
  const telefono       = (formData.get('telefono')       as string | null)?.trim() || null;
  const whatsapp       = (formData.get('whatsapp')       as string | null)?.trim() || null;
  const web            = (formData.get('web')            as string | null)?.trim() || null;
  const plan           = (formData.get('plan')           as string | null) ?? 'basico';
  const desc_es        = (formData.get('descripcion_es') as string | null)?.trim() || null;

  if (!nombre_negocio) return { error: 'El nombre del negocio es obligatorio.' };
  if (!email)          return { error: 'El email de contacto es obligatorio.' };
  if (!categoria)      return { error: 'Selecciona una categoría.' };

  const slug = `${toSlug(nombre_negocio)}-${Date.now().toString(36)}`;

  const admin = createAdminClient() as SupabaseClient;
  const { error } = await admin
    .from('anunciantes')
    .insert({
      nombre_negocio,
      slug,
      categoria,
      zona,
      email,
      telefono,
      whatsapp,
      web,
      plan,
      descripcion: desc_es ? { es: desc_es } : null,
      activo: false,
      stripe_subscription_status: 'sin_suscripcion',
    });

  if (error) return { error: error.message };
  return {};
}
