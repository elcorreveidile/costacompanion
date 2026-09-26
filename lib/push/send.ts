import "server-only";

import webpush from "web-push";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import type { PushPayload } from "@/lib/push/strings";

/**
 * Envío web push (VAPID) a todas las suscripciones activas de un perfil.
 * Best-effort: nunca lanza; los fallos transitorios se registran y una
 * suscripción muerta (404/410 del push service) se revoca en BD.
 * En Etapa 9 la plataforma 'fcm' (shell nativo) se enviará vía FCM; aquí solo
 * se tocan las filas con claves p256dh/auth (plataforma 'web').
 */

let configurado = false;

function asegurarVapid(): boolean {
  if (configurado) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hola@costacompanion.com",
    pub,
    priv
  );
  configurado = true;
  return true;
}

/** Envía un push a un perfil. Resuelve el nº de envíos aceptados por el push service. */
export async function enviarPushAPerfil(
  profileId: string,
  payload: PushPayload
): Promise<number> {
  if (!asegurarVapid()) return 0;

  const subs = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.profileId, profileId),
        isNull(pushSubscriptions.revocadaAt),
        eq(pushSubscriptions.plataforma, "web")
      )
    );

  let enviados = 0;
  for (const s of subs) {
    if (!s.p256dh || !s.auth) continue;
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      );
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        // Suscripción muerta: el navegador ya no la reconoce ⇒ revocar.
        await db
          .update(pushSubscriptions)
          .set({ revocadaAt: new Date() })
          .where(eq(pushSubscriptions.id, s.id));
      } else {
        console.error(`web-push fallo (${status ?? "sin estado"}):`, e);
      }
    }
  }
  return enviados;
}
