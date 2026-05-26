'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notificarNuevoMensaje } from '@/lib/email';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

/**
 * Envía un mensaje en el chat interno
 * Puede estar vinculado a una reserva, solicitud, o ser directo (ambos null)
 */
export async function enviarMensaje(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const receptor_id = (formData.get('receptor_id') as string | null)?.trim();
  const texto = (formData.get('texto') as string | null)?.trim();
  const reserva_id = (formData.get('reserva_id') as string | null)?.trim() || null;
  const solicitud_id = (formData.get('solicitud_id') as string | null)?.trim() || null;

  if (!receptor_id) {
    return { error: 'Destinatario no válido.' };
  }

  if (!texto) {
    return { error: 'El mensaje no puede estar vacío.' };
  }

  if (texto.length > 2000) {
    return { error: 'El mensaje es demasiado largo (máximo 2000 caracteres).' };
  }

  // Verificar que el receptor existe — usar admin para evitar restricción RLS de profiles
  const admin = createAdminClient();
  const { data: receptor } = await (admin as RawClient)
    .from('profiles')
    .select('id, nombre, idioma_preferido')
    .eq('id', receptor_id)
    .single();

  if (!receptor) {
    return { error: 'Destinatario no encontrado.' };
  }

  // Insertar mensaje
  const { data: mensaje, error } = await (supabase as RawClient).from('mensajes').insert({
    emisor_id: user.id,
    receptor_id,
    texto,
    reserva_id,
    solicitud_id,
  }).select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Revalidar paths del chat
  revalidatePath('/cliente/mensajes');
  revalidatePath('/acompanante/mensajes');

  // Notificación inteligente: solo enviar email si no hay mensajes sin leer previos
  const { data: pendientes } = await (supabase as RawClient)
    .from('mensajes')
    .select('id')
    .eq('receptor_id', receptor_id)
    .eq('emisor_id', user.id)
    .eq('leido', false)
    .limit(1);

  // Solo enviar notificación si no hay mensajes pendientes (es el primero de la "sesión")
  if (!pendientes || pendientes.length === 0) {
    const [{ data: emisorProfile }, { data: { user: receptorAuth } }] = await Promise.all([
      (admin as RawClient).from('profiles').select('nombre').eq('id', user.id).single(),
      admin.auth.admin.getUserById(receptor_id),
    ]);

    if (receptorAuth?.email) {
      await notificarNuevoMensaje({
        receptorEmail: receptorAuth.email,
        receptorNombre: receptor.nombre || 'Hola',
        emisorNombre: emisorProfile?.nombre || 'Alguien',
        idioma: receptor.idioma_preferido || 'es',
      }).catch(console.error);
    }
  }

  return {};
}

/**
 * Marca mensajes como leídos
 */
export async function marcarMensajesLeidos(emisorId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  // Marcar todos los mensajes del emisor como leídos
  await (supabase as RawClient)
    .from('mensajes')
    .update({ leido: true })
    .eq('emisor_id', emisorId)
    .eq('receptor_id', user.id)
    .eq('leido', false);

  revalidatePath('/cliente/mensajes');
  revalidatePath('/acompanante/mensajes');
}

/**
 * Obtiene las conversaciones del usuario actual
 * Agrupa por el otro interlocutor
 */
export async function getConversaciones(usuarioId: string, usuarioRol: string) {
  const admin = createAdminClient();

  // Si es cliente, busca conversaciones con acompañantes
  // Si es acompañante, busca conversaciones con clientes
  const esCliente = usuarioRol === 'cliente';

  const { data } = await (admin as RawClient)
    .from('mensajes')
    .select(`
      id,
      emisor_id,
      receptor_id,
      texto,
      leido,
      created_at,
      reserva_id,
      solicitud_id,
      emisor:profiles!emisor_id(nombre),
      receptor:profiles!receptor_id(nombre)
    `)
    .or(`emisor_id.eq.${usuarioId},receptor_id.eq.${usuarioId}`)
    .order('created_at', { ascending: false });

  const mensajes = (data ?? []) as any[];

  // Agrupar por interlocutor (la otra persona en la conversación)
  const conversacionesMap = new Map<string, any>();

  for (const msg of mensajes) {
    const otherUserId = msg.emisor_id === usuarioId ? msg.receptor_id : msg.emisor_id;
    const otherUserName = msg.emisor_id === usuarioId
      ? (msg.receptor?.nombre ?? null)
      : (msg.emisor?.nombre ?? null);

    if (!conversacionesMap.has(otherUserId)) {
      // Buscar si el otro usuario es acompañante
      const { data: acompanante } = await (admin as RawClient)
        .from('acompanantes')
        .select('id, nombre_publico, foto_url, slug')
        .eq('profile_id', otherUserId)
        .maybeSingle();

      conversacionesMap.set(otherUserId, {
        otherUserId,
        otherUserName: otherUserName || 'Usuario',
        acompanante,
        ultimoMensaje: msg.texto,
        ultimoMensajeFecha: msg.created_at,
        tieneNoLeidos: msg.emisor_id !== usuarioId && !msg.leido,
        reserva_id: msg.reserva_id,
        solicitud_id: msg.solicitud_id,
        mensajes: [],
      });
    }

    conversacionesMap.get(otherUserId).mensajes.push(msg);
  }

  // Convertir a array y ordenar por fecha del último mensaje
  return Array.from(conversacionesMap.values()).sort((a, b) =>
    new Date(b.ultimoMensajeFecha).getTime() - new Date(a.ultimoMensajeFecha).getTime()
  );
}

/**
 * Obtiene los mensajes de una conversación específica
 */
export async function getMensajesConversacion(
  usuarioId: string,
  otherUserId: string
): Promise<any[]> {
  const admin = createAdminClient();

  const { data } = await (admin as RawClient)
    .from('mensajes')
    .select(`
      id,
      emisor_id,
      texto,
      leido,
      created_at,
      reserva_id,
      solicitud_id
    `)
    .or(`and(emisor_id.eq.${usuarioId},receptor_id.eq.${otherUserId}),and(emisor_id.eq.${otherUserId},receptor_id.eq.${usuarioId})`)
    .order('created_at', { ascending: true });

  return data ?? [];
}

/**
 * Inicia una nueva conversación desde el perfil de un acompañante
 * Crea un mensaje inicial si no existe conversación previa
 */
export async function iniciarConversacion(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const acompananteSlug = (formData.get('slug') as string | null)?.trim();
  const mensajeInicial = (formData.get('mensaje') as string | null)?.trim() || 'Hola, me gustaría consultar algo sobre tus servicios.';

  if (!acompananteSlug) {
    return { error: 'Acompañante no válido.' };
  }

  // Obtener el acompañante
  const { data: acompanante } = await (supabase as RawClient)
    .from('acompanantes')
    .select('profile_id')
    .eq('slug', acompananteSlug)
    .eq('activo', true)
    .single();

  if (!acompanante) {
    return { error: 'Acompañante no encontrado.' };
  }

  // Verificar que el cliente no se está enviando un mensaje a sí mismo
  if (acompanante.profile_id === user.id) {
    return { error: 'No puedes enviar mensajes a ti mismo.' };
  }

  // Verificar si ya existe una conversación previa
  const { data: conversacionPrevia } = await (supabase as RawClient)
    .from('mensajes')
    .select('id')
    .or(`and(emisor_id.eq.${user.id},receptor_id.eq.${acompanante.profile_id}),and(emisor_id.eq.${acompanante.profile_id},receptor_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle();

  // Insertar mensaje inicial (o nuevo mensaje si ya existe conversación)
  const { error } = await (supabase as RawClient).from('mensajes').insert({
    emisor_id: user.id,
    receptor_id: acompanante.profile_id,
    texto: mensajeInicial,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/cliente/mensajes');
  revalidatePath(`/${acompananteSlug}`);

  return {};
}
