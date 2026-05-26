'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  emailNuevaReserva,
  emailReservaConfirmada,
  emailReservaRechazada,
} from '@/lib/email';

type RawClient = SupabaseClient;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function getEmailByUserId(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

// ── crearReserva ───────────────────────────────────────────────────────────────

export async function crearReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

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

  // Notificar al acompañante
  const { data: acomp } = await (supabase as RawClient)
    .from('acompanantes')
    .select('nombre_publico, email_contacto, slug')
    .eq('id', acompanante_id)
    .single() as { data: { nombre_publico: string; email_contacto: string | null; slug: string } | null; error: null };

  if (acomp?.email_contacto) {
    const { data: clienteProfile } = await (supabase as RawClient)
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .single() as { data: { nombre: string | null } | null; error: null };

    let servicioNombre: string | undefined;
    if (servicio_id) {
      const { data: svc } = await (supabase as RawClient)
        .from('servicios')
        .select('titulo')
        .eq('id', servicio_id)
        .single() as { data: { titulo: { es?: string } } | null; error: null };
      servicioNombre = svc?.titulo?.es;
    }

    emailNuevaReserva({
      toEmail: acomp.email_contacto,
      clienteNombre: clienteProfile?.nombre ?? user.email ?? 'Un cliente',
      acompananteNombre: acomp.nombre_publico,
      fechaStr: formatFecha(fecha_hora),
      servicioNombre,
    });
  }

  // Redirigir según rol: clientes van a su panel, otros roles vuelven al perfil
  const { data: perfil } = await (supabase as RawClient)
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single() as { data: { rol: string } | null; error: null };

  revalidatePath('/cliente/reservas');
  if (perfil?.rol === 'cliente') {
    redirect('/cliente/reservas');
  } else {
    redirect(`/${acomp?.slug ?? ''}`);
  }
}

// ── cancelarReserva ────────────────────────────────────────────────────────────

export async function cancelarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const reserva_id = formData.get('reserva_id') as string;

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

  if (!user) redirect('/auth/login');

  const reserva_id = formData.get('reserva_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id, nombre_publico, slug')
    .eq('profile_id', user.id)
    .single() as { data: { id: string; nombre_publico: string; slug: string } | null; error: null };

  if (!acompananteData) { revalidatePath('/acompanante/reservas'); return; }

  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('disponibilidad_id, cliente_id, fecha_hora')
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteData.id)
    .single() as { data: { disponibilidad_id: string | null; cliente_id: string; fecha_hora: string } | null; error: null };

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'confirmada' })
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteData.id);

  if (reserva?.disponibilidad_id) {
    await (supabase as RawClient)
      .from('disponibilidad')
      .update({ estado: 'cerrado' })
      .eq('id', reserva.disponibilidad_id);
  }

  // Notificar al cliente
  if (reserva) {
    const clienteEmail = await getEmailByUserId(reserva.cliente_id);
    const { data: clienteProfile } = await (supabase as RawClient)
      .from('profiles')
      .select('nombre')
      .eq('id', reserva.cliente_id)
      .single() as { data: { nombre: string | null } | null; error: null };

    if (clienteEmail) {
      emailReservaConfirmada({
        toEmail: clienteEmail,
        clienteNombre: clienteProfile?.nombre ?? 'Cliente',
        acompananteNombre: acompananteData.nombre_publico,
        acompananteSlug: acompananteData.slug,
        fechaStr: formatFecha(reserva.fecha_hora),
      });
    }
  }

  revalidatePath('/acompanante/reservas');
}

// ── rechazarReserva ────────────────────────────────────────────────────────────

export async function rechazarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const reserva_id = formData.get('reserva_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id, nombre_publico, slug')
    .eq('profile_id', user.id)
    .single() as { data: { id: string; nombre_publico: string; slug: string } | null; error: null };

  if (!acompananteData) { revalidatePath('/acompanante/reservas'); return; }

  const { data: reserva } = await (supabase as RawClient)
    .from('reservas')
    .select('cliente_id, fecha_hora')
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteData.id)
    .single() as { data: { cliente_id: string; fecha_hora: string } | null; error: null };

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'rechazada' })
    .eq('id', reserva_id)
    .eq('acompanante_id', acompananteData.id);

  // Notificar al cliente
  if (reserva) {
    const clienteEmail = await getEmailByUserId(reserva.cliente_id);
    const { data: clienteProfile } = await (supabase as RawClient)
      .from('profiles')
      .select('nombre')
      .eq('id', reserva.cliente_id)
      .single() as { data: { nombre: string | null } | null; error: null };

    if (clienteEmail) {
      emailReservaRechazada({
        toEmail: clienteEmail,
        clienteNombre: clienteProfile?.nombre ?? 'Cliente',
        acompananteNombre: acompananteData.nombre_publico,
        acompananteSlug: acompananteData.slug,
        fechaStr: formatFecha(reserva.fecha_hora),
      });
    }
  }

  revalidatePath('/acompanante/reservas');
}

// ── completarReserva ───────────────────────────────────────────────────────────

export async function completarReserva(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const reserva_id = formData.get('reserva_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!acompananteData) { revalidatePath('/acompanante/reservas'); return; }

  await (supabase as RawClient)
    .from('reservas')
    .update({ estado: 'completada' })
    .eq('id', reserva_id)
    .eq('acompanante_id', (acompananteData as { id: string }).id)
    .eq('estado', 'confirmada');

  revalidatePath('/acompanante/reservas');
}
