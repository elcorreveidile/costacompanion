# Informe de handoff: publicación en tiendas (Google Play / App Store)

> Fecha: 2026-09-27 · Estado: web en producción, shell nativo preparado, builds firmadas pendientes
> Este documento resume TODO lo hecho y lo que falta para llevar «Costa Companion» a las tiendas. Pensado para retomar el trabajo otro agente o persona sin contexto previo.

---

## 1. El producto

- **Web app** Next.js 15 (App Router, Turbopack) + React 19, desplegada en Vercel: **https://www.costacompanion.com**
- Plataforma de acompañamiento lingüístico para la Costa del Sol (Estepona, Marbella, Manilva, etc.).
- Stack servidor: Auth.js (next-auth v5 beta: Google OAuth + magic link por Brevo SMTP + credenciales número/PIN), Drizzle ORM sobre Neon Postgres, Stripe (webhooks), web-push (VAPID), Nodemailer, Vercel Blob, cron horario de recordatorios (`vercel.json`).
- i18n: español en raíz, `/en /fr /de /nl /ru /uk` vía `middleware.ts` (rewrites internos, header `x-locale`). No hay segmentos `[locale]`.
- PWA: manifest (`app/manifest.ts`, `display: standalone`, theme `#2C4A3B`, fondo `#F7F4EF`), iconos 192/512 + maskable en `public/icons/`, service worker solo de push (`public/sw.js`).

## 2. Arquitectura del shell nativo (decisión clave, ya implementada)

La app nativa **NO empaqueta la web**: es un WebView de Capacitor que carga la URL de producción (`server.url`). Consecuencias:

- Las builds nativas casi nunca necesitan re-revisión de tiendas (el contenido se actualiza en el servidor).
- Los secretos (DB, Stripe, SMTP, VAPID) viven solo en Vercel; el binario no lleva nada sensible.
- `webDir: "public"` es solo un requisito del CLI: `cap sync` copia `public/` (iconos, sw.js) al bundle nativo.
- Riesgo conocido: Apple puede rechazar wrappers de web (guideline 4.2). Argumentos a favor ya presentes: push nativo (registro), login PIN, splash nativo. Si hay rechazo, reforzar funcionalidad nativa.
- Config: `capacitor.config.ts` (appId `com.costacompanion.app`, appName «Costa Companion», plugin `SplashScreen` con fondo `#F7F4EF`).

## 3. HECHO (commits recientes, ya en `main` y desplegado)

| Commit | Contenido |
|---|---|
| `dd67ee8` | Menú agrupado desktop/móvil (anterior a esta sesión) |
| `66b28db` | Fix menú móvil: `block` en los enlaces de `components/layout/MobileMenu.tsx:92` (se apilaban en una línea) |
| `f7d6be5` | **Etapa 9**: proyectos nativos Capacitor 8 + assets de tienda + metas PWA iOS |

### 3.1 Entorno
- **Node 22.23.3** instalado vía nvm y fijado con `.nvmrc` (Capacitor 8 exige >=22). OJO: la sesión de shell no persiste el PATH de nvm entre comandos → prefijar con `source ~/.nvm/nvm.sh && nvm use 22`.
- La máquina (macOS, arm64) tiene: JDK 17. **NO tiene**: Xcode completo (solo CLT), Android SDK, CocoaPods (innecesario: Capacitor 8 usa SPM por defecto en iOS).

### 3.2 Dependencias (`package.json`)
- `dependencies`: `@capacitor/core ^8.5.2`, `@capacitor/android ^8.5.2`, `@capacitor/ios ^8.5.2`, `@capacitor/push-notifications ^8.1.2`, `@capacitor/splash-screen ^8.0.2`
- `devDependencies`: `@capacitor/cli ^8.5.2`, `@capacitor/assets ^3.0.5`
- Scripts nuevos: `npm run icons` (gen-icons.mjs), `npm run cap:sync`

### 3.3 Proyectos nativos generados
- `android/`: Gradle/AGP plantilla Capacitor 8, `applicationId com.costacompanion.app`, MainActivity Java.
- `ios/`: proyecto Xcode con **SPM** (`ios/App/CapApp-SPM/Package.swift`, sin Podfile). Ambos plugins registrados.
- Se generaron SIN toolchain completa (Android SDK/Xcode) — solo plantillas de ficheros. Compilar exige instalar esas herramientas.

### 3.4 Iconos y splash de tienda
- `scripts/gen-icons.mjs` ampliado: renderizador PNG puro (sin dependencias) con geometría de marca compartida (`geometriaMarca`) y factoría `marca({ fondo, fondoAlfa, escala, colorAnillo, colorPunto })`.
- Fuentes en `resources/` (commiteadas): `icon-only.png` (1024, verde a sangre), `icon-background.png`, `icon-foreground.png` (transparencia, escala 0.8 → contenido a ~20 % del radio, dentro del círculo seguro del adaptive icon), `splash.png` (2732², crema, anillo VERDE — variante LogoSymbol), `splash-dark.png` (2732², verde, anillo crema).
- Regenerables con `npm run icons`. Los iconos PWA de `public/icons/` quedaron byte a byte idénticos (no tocar `icono()`).
- Generados en nativo con `npx @capacitor/assets generate --android --ios` (74 assets Android: launchers adaptive + splash con variantes night; 7 iOS: AppIcon 1024 + `Splash.imageset` claro/oscuro).

### 3.5 Splash nativo (`capacitor.config.ts`)
- Bloque `plugins.SplashScreen`: `launchShowDuration 500`, `launchAutoHide true`, `backgroundColor #F7F4EF`, `androidScaleType CENTER_CROP`. Necesario porque con `server.url` el splash debe persistir hasta que la página remota pinte.

### 3.6 Metas PWA/iOS (`app/layout.tsx`)
- `export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2C4A3B" }`.
- `appleWebApp: { capable: true, statusBarStyle: "default", title: "Costa Companion" }` va dentro de `generateMetadata()` (**en Next 15 `appleWebApp` pertenece a Metadata, NO a Viewport** — el build falla si se equivoca de sitio).
- Deliberadamente SIN `viewportFit: "cover"`: el CSS no gestiona `env(safe-area-inset-*)` y la cabecera quedaría bajo el notch. Si algún día se quiere black-translucent, añadir antes safe-area-padding al header.

### 3.7 Verificación realizada
- `npm run build` ✓ · `npm run cap:sync` (ambos) ✓ · assets presentes en catálogos ✓ · splash registrado en `capacitor.config.json` nativo ✓ · deploy Vercel Ready ✓.

## 4. POR HACER (orden recomendado)

### 4.1 Push nativo vía FCM (punto 4 aplazado de la sesión)
- `components/push/CapacitorPushBridge.tsx` ya registra tokens FCM en nativo (`Capacitor.isNativePlatform()` guard; import dinámico; POST a `lib/push/actions`).
- **Falta**: proyecto Firebase → `google-services.json` (Android) + `GoogleService-Info.plist` (iOS), credenciales de servidor FCM (OAuth2 service account), e implementar el envío en `lib/push/send.ts` para `plataforma='fcm'` (hoy solo envía por web-push VAPID). El fichero ya documenta «Etapa 9».

### 4.2 OAuth dentro del WebView (riesgo alto — probar en dispositivo)
- Google bloquea logins en WebViews (`disallowed_useragent`). Con `server.url` sobre HTTPS suele mitigarse, pero hay que probarlo en Android/iOS reales.
- Plan B: magic link por email → requiere **Universal Links (iOS, `apple-app-site-association` en el dominio)** y **App Links (Android, `assetlinks.json`)** para que el enlace reabra la app. Ninguno de los dos ficheros está creado todavía.

### 4.3 Builds nativas firmadas
- Instalar **Xcode 26+** (`sudo xcode-select -s /Applications/Xcode.app`) → `npx cap open ios` → firmar con Apple Developer account → archive/IPA.
- Instalar **Android Studio** (bundles JDK 21) → `npx cap open android` → keystore de release → `.aab` firmado (`bundleRelease`). El JDK 17 actual vale para AGP, pero Android Studio traerá el suyo.
- Tras cualquier cambio web que importe al shell: `npm run cap:sync` (raramente necesario con shell remoto).

### 4.4 Cuentas de desarrollador (bloquea todo lo anterior en firme)
- **Google Play Console**: 25 USD una vez. AVISO: cuentas personales nuevas exigen **testing cerrado con ~12 testers durante 14 días** antes de producción (cuentas de empresa con DUNS exentas).
- **Apple Developer Program**: 99 USD/año.

### 4.5 Listings de tienda
- Capturas (iPhone + Android), descripciones (ES + resto de idiomas), keywords.
- Formularios: «Data safety» (Play), «Privacy nutrition labels» (Apple), clasificación de contenido.
- URLs necesarias (ya existen): privacidad `https://www.costacompanion.com/legal/privacidad`, términos `/legal/terminos`, aviso de intermediación `/legal/intermediacion` (útil para Play al ser plataforma), contacto `info@costacompanion.com` + WhatsApp (`NEXT_PUBLIC_WHATSAPP`).
- Falta una página/ruta de soporte dedicada (recomendado por ambas tiendas).

### 4.6 Menores
- `.env.example`: falta `NEXT_PUBLIC_WHATSAPP` (se usa en `SiteFooter.tsx`).
- `@supabase/*` en dependencias «en retirada» (legado) — limpiar en alguna pasada.
- Si se regenera arte de marca: mantener el contenido de la capa foreground a ≤20 % del radio.

## 5. Comandos de referencia

```bash
source ~/.nvm/nvm.sh && nvm use 22   # SIEMPRE antes de nada en esta máquina
npm run build                        # build web
npm run icons                        # regenera public/icons/* y resources/*
npm run cap:sync                     # copia web + plugins a android/ e ios/
npx cap open android                 # abrir en Android Studio (requiere instalación)
npx cap open ios                     # abrir en Xcode (requiere instalación)
npx @capacitor/assets generate --android --ios   # regenerar assets de tienda desde resources/
```

## 6. Ficheros clave

| Fichero | Papel |
|---|---|
| `capacitor.config.ts` | Shell nativo: appId, `server.url` producción, plugin SplashScreen |
| `scripts/gen-icons.mjs` | Renderizador PNG de marca (PWA + fuentes de tienda) |
| `resources/` | Fuentes de iconos/splash para `@capacitor/assets` |
| `components/push/CapacitorPushBridge.tsx` | Registro FCM en nativo (web-safe) |
| `lib/push/send.ts` | Envío de push (falta rama FCM) |
| `app/layout.tsx` | viewport + appleWebApp + metadata |
| `app/manifest.ts` | Manifest PWA (theme `#2C4A3B`, fondo `#F7F4EF`) |
| `components/layout/MobileMenu.tsx` | Menú móvil (fix `block` en enlaces, línea 92) |
| `.nvmrc` | Fija Node 22 |

## 7. Estado del repo

- Rama `main`, sincronizada con `origin/main`, deploy de producción en Vercel (proyecto `javiers-projects-cc8068ed/costacompanion`, dominio `costacompanion.com`). Vercel ignora `android/`, `ios/`, `resources/` en el deploy web.
- Tests existentes: `npm run test` (node:test + tsx: motor de precios, tiempos DST, i18n).
- `android/` e `ios/` están COMMITEADOS a propósito (política de Capacitor); sus `.gitignore` internos excluyen builds.
