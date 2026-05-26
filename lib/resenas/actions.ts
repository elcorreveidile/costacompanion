'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

export async function crearResena(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const acompanante_id = (formData.get('acompanante_id') as string | null)?.trim();
  const slug = (formData.get('slug') as string | null)?.trim();
  const puntuacion = Number(formData.get('puntuacion'));
  const comentario = (formData.get('comentario') as string | null)?.trim() || null;

  if (!acompanante_id || !puntuacion || puntuacion < 1 || puntuacion > 5) {
    return { error: 'Puntuación inválida.' };
  }

  // Comprobar que no ha dejado ya una reseña para este acompañante
  const { data: existing } = await (supabase as RawClient)
    .from('resenas')
    .select('id')
    .eq('acompanante_id', acompanante_id)
    .eq('cliente_id', user.id)
    .maybeSingle();

  if (existing) {
    return { error: 'Ya has dejado una reseña para este acompañante.' };
  }

  // Buscar la reserva completada más reciente para vincularla (opcional)
  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('id')
    .eq('acompanante_id', acompanante_id)
    .eq('cliente_id', user.id)
    .eq('estado', 'completada')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await (supabase as RawClient).from('resenas').insert({
    acompanante_id,
    cliente_id: user.id,
    reserva_id: reserva?.id ?? null,
    puntuacion,
    comentario,
  });

  if (error) return { error: error.message };

  if (slug) {
    revalidatePath(`/${slug}`);
  }
  return {};
}
