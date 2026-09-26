import type { MetadataRoute } from "next";

/**
 * Manifest PWA. Instalable en móvil/desktop; la web push (VAPID) y el cron de
 * recordatorios viven sobre esto. El shell nativo de Capacitor (Etapa 9) carga
 * esta misma PWA.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Costa Companion",
    short_name: "Costa Companion",
    description:
      "Plataforma de acompañamiento lingüístico para residentes y visitantes de la Costa del Sol.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4EF",
    theme_color: "#2C4A3B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
