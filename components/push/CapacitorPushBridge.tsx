"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { registrarTokenFcm } from "@/lib/push/actions";

/**
 * Puente de notificaciones para el shell nativo de Capacitor (Etapa 9).
 * En navegador normal no hace nada (no hay `Capacitor.isNativePlatform()`).
 * Dentro del shell: registra el dispositivo y guarda el token FCM en
 * `push_subscriptions` con plataforma='fcm'. Import dinámico del plugin para
 * no meter Capacitor en el bundle web.
 */
export function CapacitorPushBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelado = false;
    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        await PushNotifications.addListener("registration", (token) => {
          if (!cancelado && token?.value) {
            registrarTokenFcm(token.value).catch((e) =>
              console.error("CapacitorPushBridge: registrar token:", e)
            );
          }
        });
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("CapacitorPushBridge: registrationError:", err);
        });

        if (!cancelado) await PushNotifications.register();
      } catch (e) {
        console.error("CapacitorPushBridge:", e);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return null;
}
