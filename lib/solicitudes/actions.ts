'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  emailNuevaSolicitud,
  emailSolicitudAceptada,
  emailSolicitudRechazada,
} from '@/lib/email';

type RawClient = SupabaseClient;

async function getEmailByUserId(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

// ── crearSolicitud ─────────────────────────────────────────────────────────────

export async function crearSolicitud(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const acompanante_id = formData.get('acompanante_id') as string;
  const descripcion = formData.get('descripcion') as string;
  const detalle_servicio = (formData.get('detalle_servicio') as string | null) || null;
  const fecha_hora_deseada = (formData.get('fecha_hora_deseada') as string | null) || null;
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

  // Notificar al acompañante
  const { data: acomp } = await (supabase as RawClient)
    .from('acompanantes')
    .select('nombre_publico, email_contacto')
    .eq('id', acompanante_id)
    .single() as { data: { nombre_publico: string; email_contacto: string | null } | null; error: null };

  if (acomp?.email_contacto) {
    const { data: clienteProfile } = await (supabase as RawClient)
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .single() as { data: { nombre: string | null } | null; error: null };

    emailNuevaSolicitud({
      toEmail: acomp.email_contacto,
      clienteNombre: clienteProfile?.nombre ?? user.email ?? 'Un cliente',
      acompananteNombre: acomp.nombre_publico,
      descripcion,
    });
  }

  revalidatePath('/cliente/solicitudes');
  redirect('/cliente/solicitudes');
}

// ── aceptarSolicitud ───────────────────────────────────────────────────────────

export async function aceptarSolicitud(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const solicitud_id = formData.get('solicitud_id') as string;
  const precio_propuesto_raw = formData.get('precio_propuesto') as string | null;
  const precio_propuesto = precio_propuesto_raw ? Number(precio_propuesto_raw) : null;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id, nombre_publico, slug')
    .eq('profile_id', user.id)
    .single() as { data: { id: string; nombre_publico: string; slug: string } | null; error: null };

  if (!acompananteData) { revalidatePath('/acompanante/solicitudes'); return; }

  const { data: solicitud } = await (supabase as RawClient)
    .from('solicitudes')
    .select('cliente_id')
    .eq('id', solicitud_id)
    .eq('acompanante_id', acompananteData.id)
    .single() as { data: { cliente_id: string } | null; error: null };

  await (supabase as RawClient)
    .from('solicitudes')
    .update({ estado: 'aceptada', precio_propuesto })
    .eq('id', solicitud_id)
    .eq('acompanante_id', acompananteData.id);

  // Notificar al cliente
  if (solicitud) {
    const clienteEmail = await getEmailByUserId(solicitud.cliente_id);
    const { data: clienteProfile } = await (supabase as RawClient)
      .from('profiles')
      .select('nombre')
      .eq('id', solicitud.cliente_id)
      .single() as { data: { nombre: string | null } | null; error: null };

    if (clienteEmail) {
      emailSolicitudAceptada({
        toEmail: clienteEmail,
        clienteNombre: clienteProfile?.nombre ?? 'Cliente',
        acompananteNombre: acompananteData.nombre_publico,
        acompananteSlug: acompananteData.slug,
        precio: precio_propuesto,
      });
    }
  }

  revalidatePath('/acompanante/solicitudes');
}

// ── rechazarSolicitud ──────────────────────────────────────────────────────────

export async function rechazarSolicitud(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const solicitud_id = formData.get('solicitud_id') as string;

  const { data: acompananteData } = await (supabase as RawClient)
    .from('acompanantes')
    .select('id, nombre_publico, slug')
    .eq('profile_id', user.id)
    .single() as { data: { id: string; nombre_publico: string; slug: string } | null; error: null };

  if (!acompananteData) { revalidatePath('/acompanante/solicitudes'); return; }

  const { data: solicitud } = await (supabase as RawClient)
    .from('solicitudes')
    .select('cliente_id')
    .eq('id', solicitud_id)
    .eq('acompanante_id', acompananteData.id)
    .single() as { data: { cliente_id: string } | null; error: null };

  await (supabase as RawClient)
    .from('solicitudes')
    .update({ estado: 'rechazada' })
    .eq('id', solicitud_id)
    .eq('acompanante_id', acompananteData.id);

  // Notificar al cliente
  if (solicitud) {
    const clienteEmail = await getEmailByUserId(solicitud.cliente_id);
    const { data: clienteProfile } = await (supabase as RawClient)
      .from('profiles')
      .select('nombre')
      .eq('id', solicitud.cliente_id)
      .single() as { data: { nombre: string | null } | null; error: null };

    if (clienteEmail) {
      emailSolicitudRechazada({
        toEmail: clienteEmail,
        clienteNombre: clienteProfile?.nombre ?? 'Cliente',
        acompananteNombre: acompananteData.nombre_publico,
      });
    }
  }

  revalidatePath('/acompanante/solicitudes');
}
