'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

// ── crearReserva ───────────────────────────────────────────────────────────────

export async function crearReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const acompanante_id = formData.get('acompanante_id') as string;
  const servicio_id = (formData.get('servicio_id') as string | null) || null;
  const disponibilidad_id = (formData.get('disponibilidad_id') as string | null) || null;
  const fecha_hora = formData.get('fecha_hora') as string;
  const modalidad = formData.get('modalidad') as string;
  const zona = (formData.get('zona') as string | null) || null;
  const detalle_servicio = (formData.get('detalle_servicio') as string | null) || null;

  await (supabase as RawClient).from('reservas').insert({
    acompanante_id,
    cliente_id: user.id,
    servicio_id: servicio_id || null,
    disponibilidad_id: disponibilidad_id || null,
    fecha_hora,
    modalidad,
    zona,
    detalle_servicio,
    estado: 'pendiente',
  });

  revalidatePath('/cliente/reservas');
  redirect('/cliente/reservas');
}

// ── cancelarReserva ────────────────────────────────────────────────────────────

export async function cancelarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const reserva_id = formData.get('reserva_id') as string;

  // Obtener la reserva para comprobar disponibilidad_id
  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('disponibilidad_id')
    .eq('id', reserva_id)
    .eq('cliente_id', user.id)
    .single();

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'cancelada', cancelada_at: new Date().toISOString() })
    .eq('id', reserva_id)
    .eq('cliente_id', user.id);

  if (reserva?.disponibilidad_id) {
    await (supabase as RawClient)
      .from('disponibilidad')
      .update({ estado: 'abierto' })
      .eq('id', reserva.disponibilidad_id);
  }

  revalidatePath('/cliente/reservas');
}

// ── confirmarReserva ───────────────────────────────────────────────────────────

export async function confirmarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const reserva_id = formData.get('reserva_id') as string;

  // Obtener acompanante_id del usuario autenticado
  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) {
    revalidatePath('/acompanante/reservas');
    return;
  }

  const acompananteId = acompananteData.id as string;

  // Obtener la reserva para comprobar disponibilidad_id
  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('disponibilidad_id')
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteId)
    .single();

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'confirmada' })
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteId);

  if (reserva?.disponibilidad_id) {
    await (supabase as RawClient)
      .from('disponibilidad')
      .update({ estado: 'cerrado' })
      .eq('id', reserva.disponibilidad_id);
  }

  revalidatePath('/acompanante/reservas');
}

// ── rechazarReserva ────────────────────────────────────────────────────────────

export async function rechazarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const reserva_id = formData.get('reserva_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) {
    revalidatePath('/acompanante/reservas');
    return;
  }

  const acompananteId = acompananteData.id as string;

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'rechazada' })
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteId);

  revalidatePath('/acompanante/reservas');
}

// ── completarReserva ───────────────────────────────────────────────────────────

export async function completarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const reserva_id = formData.get('reserva_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) {
    revalidatePath('/acompanante/reservas');
    return;
  }

  const acompananteId = acompananteData.id as string;

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'completada' })
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteId)
    .eq('estado', 'confirmada');

  revalidatePath('/acompanante/reservas');
}
