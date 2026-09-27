/// <reference types="@capacitor/splash-screen" />
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Shell nativo de Costa Companion (Etapa 9).
 *
 * El shell NO empaqueta la web: carga el dominio de producción (`server.url`),
 * de modo que las builds nativas son una ventana sobre la misma PWA y el
 * contenido se actualiza sin pasar revisión de tiendas.
 *
 * `cap add ios` / `cap add android` + cuentas Apple Dev / Google Play quedan
 * diferidos a la fase de tiendas; este config ya es el que usarán.
 */
const config: CapacitorConfig = {
  appId: "com.costacompanion.app",
  appName: "Costa Companion",
  // Requisito del CLI aunque el shell cargue URL remota; apunta a contenido estático.
  webDir: "public",
  server: {
    // El shell nativo carga la PWA publicada (cambiar aquí si cambia el dominio).
    url: "https://www.costacompanion.com",
    cleartext: false,
  },
  plugins: {
    // Con shell de URL remota, el splash debe persistir hasta que la página
    // pinte; el fondo iguala resources/splash.png para que el splash de
    // sistema (Android 12+) y el del plugin sean una sola superficie.
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: "#F7F4EF",
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
