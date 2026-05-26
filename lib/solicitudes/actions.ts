'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

// ── crearSolicitud ─────────────────────────────────────────────────────────────

export async function crearSolicitud(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const acompanante_id = formData.get('acompanante_id') as string;
  const descripcion = formData.get('descripcion') as string;
  const detalle_servicio = (formData.get('detalle_servicio') as string | null) || null;
  const fecha_hora_deseada_raw = (formData.get('fecha_hora_deseada') as string | null) || null;
  const fecha_hora_deseada = fecha_hora_deseada_raw || null;
  const modalidad = formData.get('modalidad') as string;
  const zona = (formData.get('zona') as string | null) || null;

  await (supabase as RawClient).from('solicitudes').insert({
    acompanante_id,
    cliente_id: user.id,
    descripcion,
    detalle_servicio,
    fecha_hora_deseada,
    modalidad,
    zona,
    estado: 'pendiente',
  });

  revalidatePath('/cliente/solicitudes');
  redirect('/cliente/solicitudes');
}

// ── aceptarSolicitud ───────────────────────────────────────────────────────────

export async function aceptarSolicitud(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const solicitud_id = formData.get('solicitud_id') as string;
  const precio_propuesto_raw = formData.get('precio_propuesto') as string | null;
  const precio_propuesto = precio_propuesto_raw ? Number(precio_propuesto_raw) : null;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) {
    revalidatePath('/acompanante/solicitudes');
    return;
  }

  const acompananteId = acompananteData.id as string;

  await (supabase as RawClient)
    .from('solicitudes')
    .update({ estado: 'aceptada', precio_propuesto })
    .eq('id', solicitud_id)
    .eq('acompanante_id', acompananteId);

  revalidatePath('/acompanante/solicitudes');
}

// ── rechazarSolicitud ──────────────────────────────────────────────────────────

export async function rechazarSolicitud(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const solicitud_id = formData.get('solicitud_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) {
    revalidatePath('/acompanante/solicitudes');
    return;
  }

  const acompananteId = acompananteData.id as string;

  await (supabase as RawClient)
    .from('solicitudes')
    .update({ estado: 'rechazada' })
    .eq('id', solicitud_id)
    .eq('acompanante_id', acompananteId);

  revalidatePath('/acompanante/solicitudes');
}
