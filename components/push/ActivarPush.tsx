"use client";

import { useEffect, useState } from "react";
import { suscribirseAPush } from "@/lib/push/actions";

type Estado = "inicial" | "activando" | "activadas" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Botón «Activar notificaciones». El permiso se pide SOLO al pulsar (nunca
 * prompt automático). Registra /sw.js, suscribe el navegador vía VAPID y
 * guarda la suscripción en BD (upsert por endpoint).
 */
export function ActivarPush({
  labels,
}: {
  labels: { activar: string; activadas: string; error: string };
}) {
  const [estado, setEstado] = useState<Estado>("inicial");

  useEffect(() => {
    // Ya suscrito en este navegador ⇒ mostrar como activadas.
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") setEstado("activadas");
      })
      .catch(() => undefined);
  }, []);

  async function activar() {
    setEstado("activando");
    try {
      const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!clave || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("push no soportado");
      }
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") throw new Error("permiso denegado");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(clave),
      });

      const r = await suscribirseAPush(sub.toJSON());
      if (!r.ok) throw new Error("no se pudo guardar la suscripción");
      setEstado("activadas");
    } catch {
      setEstado("error");
    }
  }

  const texto =
    estado === "activadas"
      ? labels.activadas
      : estado === "error"
        ? labels.error
        : labels.activar;

  return (
    <button
      type="button"
      onClick={activar}
      disabled={estado === "activando" || estado === "activadas"}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-60"
      style={
        estado === "activadas"
          ? { border: "1px solid var(--line)", color: "var(--ink)", background: "transparent" }
          : { background: "var(--green)", color: "var(--bone)" }
      }
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {texto}
    </button>
  );
}
