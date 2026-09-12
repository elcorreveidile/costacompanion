"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { mensajes, profiles, acompanantes } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { notificarNuevoMensaje } from "@/lib/email";

export interface MensajeDTO {
  id: string;
  emisor_id: string;
  receptor_id: string;
  texto: string;
  leido: boolean;
  created_at: string;
  reserva_id: string | null;
  solicitud_id: string | null;
}

export interface ConversacionDTO {
  otherUserId: string;
  otherUserName: string;
  acompanante: {
    id: string;
    nombre_publico: string;
    foto_url: string | null;
    slug: string;
  } | null;
  ultimoMensaje: string;
  ultimoMensajeFecha: string;
  tieneNoLeidos: boolean;
  reserva_id: string | null;
  solicitud_id: string | null;
  mensajes: MensajeDTO[];
}

/**
 * Envía un mensaje del chat interno. Puede ir ligado a una reserva, una
 * solicitud, o ser directo.
 */
export async function enviarMensaje(
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const receptorId = (formData.get("receptor_id") as string | null)?.trim();
  const texto = (formData.get("texto") as string | null)?.trim();
  const reservaId = (formData.get("reserva_id") as string | null)?.trim() || null;
  const solicitudId = (formData.get("solicitud_id") as string | null)?.trim() || null;

  if (!receptorId) return { error: "Destinatario no válido." };
  if (!texto) return { error: "El mensaje no puede estar vacío." };
  if (texto.length > 2000) {
    return { error: "El mensaje es demasiado largo (máximo 2000 caracteres)." };
  }

  const [receptor] = await db
    .select({
      id: profiles.id,
      nombre: profiles.nombre,
      email: profiles.email,
      idioma: profiles.idiomaPreferido,
    })
    .from(profiles)
    .where(eq(profiles.id, receptorId))
    .limit(1);
  if (!receptor) return { error: "Destinatario no encontrado." };

  try {
    await db.insert(mensajes).values({
      emisorId: user.id,
      receptorId,
      texto,
      reservaId,
      solicitudId,
    });
  } catch (e) {
    console.error("enviarMensaje:", e);
    return { error: "No se pudo enviar el mensaje." };
  }

  revalidatePath("/cliente/mensajes");
  revalidatePath("/acompanante/mensajes");

  // Notificación por email al receptor (con su email, ya en profiles).
  if (receptor.email) {
    const [emisor] = await db
      .select({ nombre: profiles.nombre })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    await notificarNuevoMensaje({
      receptorEmail: receptor.email,
      receptorNombre: receptor.nombre || "Hola",
      emisorNombre: emisor?.nombre || "Alguien",
      idioma: receptor.idioma || "es",
    }).catch(console.error);
  }

  return {};
}

/** Marca como leídos los mensajes recibidos de `emisorId`. */
export async function marcarMensajesLeidos(emisorId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  await db
    .update(mensajes)
    .set({ leido: true })
    .where(
      and(
        eq(mensajes.emisorId, emisorId),
        eq(mensajes.receptorId, user.id),
        eq(mensajes.leido, false)
      )
    );

  revalidatePath("/cliente/mensajes");
  revalidatePath("/acompanante/mensajes");
}

/** Conversaciones del usuario, agrupadas por interlocutor. */
export async function getConversaciones(
  usuarioId: string
): Promise<ConversacionDTO[]> {
  const emisorP = alias(profiles, "emisor_p");
  const receptorP = alias(profiles, "receptor_p");

  const rows = await db
    .select({
      id: mensajes.id,
      emisorId: mensajes.emisorId,
      receptorId: mensajes.receptorId,
      texto: mensajes.texto,
      leido: mensajes.leido,
      createdAt: mensajes.createdAt,
      reservaId: mensajes.reservaId,
      solicitudId: mensajes.solicitudId,
      emisorNombre: emisorP.nombre,
      receptorNombre: receptorP.nombre,
    })
    .from(mensajes)
    .leftJoin(emisorP, eq(emisorP.id, mensajes.emisorId))
    .leftJoin(receptorP, eq(receptorP.id, mensajes.receptorId))
    .where(or(eq(mensajes.emisorId, usuarioId), eq(mensajes.receptorId, usuarioId)))
    .orderBy(desc(mensajes.createdAt));

  // Fichas de acompañante de los interlocutores (una sola consulta).
  const otherIds = Array.from(
    new Set(
      rows.map((m) => (m.emisorId === usuarioId ? m.receptorId : m.emisorId))
    )
  );
  const fichas =
    otherIds.length > 0
      ? await db
          .select({
            profileId: acompanantes.profileId,
            id: acompanantes.id,
            nombrePublico: acompanantes.nombrePublico,
            fotoUrl: acompanantes.fotoUrl,
            slug: acompanantes.slug,
          })
          .from(acompanantes)
          .where(inArray(acompanantes.profileId, otherIds))
      : [];
  const fichaPorProfile = new Map(fichas.map((f) => [f.profileId, f]));

  const convs = new Map<string, ConversacionDTO>();
  for (const m of rows) {
    const otherUserId = m.emisorId === usuarioId ? m.receptorId : m.emisorId;
    const otherUserName =
      m.emisorId === usuarioId ? m.receptorNombre : m.emisorNombre;

    const dto: MensajeDTO = {
      id: m.id,
      emisor_id: m.emisorId,
      receptor_id: m.receptorId,
      texto: m.texto,
      leido: m.leido,
      created_at: m.createdAt.toISOString(),
      reserva_id: m.reservaId,
      solicitud_id: m.solicitudId,
    };

    if (!convs.has(otherUserId)) {
      const ficha = fichaPorProfile.get(otherUserId);
      convs.set(otherUserId, {
        otherUserId,
        otherUserName: otherUserName || "Usuario",
        acompanante: ficha
          ? {
              id: ficha.id,
              nombre_publico: ficha.nombrePublico,
              foto_url: ficha.fotoUrl,
              slug: ficha.slug,
            }
          : null,
        ultimoMensaje: m.texto,
        ultimoMensajeFecha: dto.created_at,
        tieneNoLeidos: m.emisorId !== usuarioId && !m.leido,
        reserva_id: m.reservaId,
        solicitud_id: m.solicitudId,
        mensajes: [],
      });
    }
    convs.get(otherUserId)!.mensajes.push(dto);
  }

  return Array.from(convs.values()).sort(
    (a, b) =>
      new Date(b.ultimoMensajeFecha).getTime() -
      new Date(a.ultimoMensajeFecha).getTime()
  );
}

/** Mensajes de una conversación concreta, en orden cronológico. */
export async function getMensajesConversacion(
  usuarioId: string,
  otherUserId: string
): Promise<MensajeDTO[]> {
  const rows = await db
    .select()
    .from(mensajes)
    .where(
      or(
        and(eq(mensajes.emisorId, usuarioId), eq(mensajes.receptorId, otherUserId)),
        and(eq(mensajes.emisorId, otherUserId), eq(mensajes.receptorId, usuarioId))
      )
    )
    .orderBy(asc(mensajes.createdAt));

  return rows.map((m) => ({
    id: m.id,
    emisor_id: m.emisorId,
    receptor_id: m.receptorId,
    texto: m.texto,
    leido: m.leido,
    created_at: m.createdAt.toISOString(),
    reserva_id: m.reservaId,
    solicitud_id: m.solicitudId,
  }));
}

/** Inicia (o reabre) una conversación con un acompañante desde su ficha. */
export async function iniciarConversacion(
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const slug = (formData.get("slug") as string | null)?.trim();
  const mensajeInicial =
    (formData.get("mensaje") as string | null)?.trim() ||
    "Hola, me gustaría consultar algo sobre tus servicios.";

  if (!slug) return { error: "Acompañante no válido." };

  const [acomp] = await db
    .select({ profileId: acompanantes.profileId })
    .from(acompanantes)
    .where(and(eq(acompanantes.slug, slug), eq(acompanantes.activo, true)))
    .limit(1);
  if (!acomp) return { error: "Acompañante no encontrado." };
  if (acomp.profileId === user.id) {
    return { error: "No puedes enviar mensajes a ti mismo." };
  }

  const [previa] = await db
    .select({ id: mensajes.id })
    .from(mensajes)
    .where(
      or(
        and(eq(mensajes.emisorId, user.id), eq(mensajes.receptorId, acomp.profileId)),
        and(eq(mensajes.emisorId, acomp.profileId), eq(mensajes.receptorId, user.id))
      )
    )
    .limit(1);

  if (!previa) {
    try {
      await db.insert(mensajes).values({
        emisorId: user.id,
        receptorId: acomp.profileId,
        texto: mensajeInicial,
      });
    } catch (e) {
      console.error("iniciarConversacion:", e);
      return { error: "No se pudo iniciar la conversación." };
    }
    revalidatePath("/cliente/mensajes");
    revalidatePath(`/${slug}`);
  }

  redirect("/cliente/mensajes");
}
