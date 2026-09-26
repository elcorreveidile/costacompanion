"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Alta/renovación de una suscripción web push (upsert por endpoint, que es
 * único). Llamada desde el botón «Activar notificaciones» de los dashboards;
 * NUNCA se pide permiso automáticamente.
 */
export async function suscribirseAPush(subscripcion: {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  const endpoint = subscripcion?.endpoint;
  const p256dh = subscripcion?.keys?.p256dh;
  const auth = subscripcion?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return { ok: false };

  const h = await headers();
  const userAgent = h.get("user-agent")?.slice(0, 300) ?? null;

  await db
    .insert(pushSubscriptions)
    .values({
      profileId: user.id,
      plataforma: "web",
      endpoint,
      p256dh,
      auth,
      userAgent,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        profileId: user.id,
        p256dh,
        auth,
        userAgent,
        revocadaAt: null, // reactivar si estaba revocada
      },
    });

  return { ok: true };
}

/** Baja de una suscripción (el propio navegador la anula al desuscribirse). */
export async function anularSuscripcionPush(endpoint: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user || !endpoint) return { ok: false };
  await db
    .update(pushSubscriptions)
    .set({ revocadaAt: new Date() })
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return { ok: true };
}

/**
 * Registro del token FCM desde el shell nativo de Capacitor (Etapa 9).
 * El envío real vía FCM HTTP v1 / APNs se activa en la fase de tiendas; la
 * fila ya queda guardada con plataforma='fcm'. `endpoint` sintético único
 * (`fcm:<token>`) para reutilizar la restricción UNIQUE como upsert.
 */
export async function registrarTokenFcm(token: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user || !token) return { ok: false };

  const h = await headers();
  const endpoint = `fcm:${token}`;
  await db
    .insert(pushSubscriptions)
    .values({
      profileId: user.id,
      plataforma: "fcm",
      endpoint,
      tokenFcm: token,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        profileId: user.id,
        tokenFcm: token,
        revocadaAt: null,
      },
    });

  return { ok: true };
}
