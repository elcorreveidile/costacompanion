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

  const reserva_id = (formData.get('reserva_id') as string | null)?.trim();
  const puntuacion = Number(formData.get('puntuacion'));
  const comentario = (formData.get('comentario') as string | null)?.trim() || null;

  if (!reserva_id) {
    return { error: 'Accede desde Mis reservas.' };
  }

  if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
    return { error: 'Puntuación inválida.' };
  }

  // Validate: reservation exists, belongs to user, estado='completada'
  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('id, acompanante_id, acompanantes(slug)')
    .eq('id', reserva_id)
    .eq('cliente_id', user.id)
    .eq('estado', 'completada')
    .single();

  if (!reserva) {
    return { error: 'No tienes una reserva completada que puedas reseñar.' };
  }

  // Check no existing review for this reserva_id
  const { data: existing } = await (supabase as RawClient)
    .from('resenas')
    .select('id')
    .eq('reserva_id', reserva_id)
    .maybeSingle();

  if (existing) {
    return { error: 'Ya has dejado una reseña para esta reserva.' };
  }

  // Derive acompanante_id from the reservation (never trust URL param)
  type ReservaTyped = { id: string; acompanante_id: string; acompanantes: { slug: string } | null };
  const typed = reserva as unknown as ReservaTyped;
  const acompanante_id = typed.acompanante_id;
  const slug = typed.acompanantes?.slug;

  const { error } = await (supabase as RawClient).from('resenas').insert({
    acompanante_id,
    cliente_id: user.id,
    reserva_id,
    puntuacion,
    comentario,
  });

  if (error) return { error: error.message };

  if (slug) {
    revalidatePath(`/${slug}`);
  }
  return {};
}
