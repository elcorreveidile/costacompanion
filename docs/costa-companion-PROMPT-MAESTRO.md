# PROMPT MAESTRO — Costa Companion

### Plataforma de acompañamiento lingüístico · Costa del Sol

### Documento de construcción para Claude Code

> **Cómo usar este documento.** Este `.md` contiene TODO el contexto del proyecto (Partes 1–8) y un **plan de construcción por fases** (Parte 9). Pásale a Claude Code primero las Partes 1–8 como contexto del proyecto. Después ve pidiéndole **una fase cada vez** (Fase 0, luego Fase 1, etc.), comprobando que cada fase funciona antes de pasar a la siguiente. No le pidas todas las fases de golpe.

-----

## PARTE 1 — Qué estamos construyendo

**Costa Companion** es una plataforma web multilingüe (marketplace) que conecta a residentes y visitantes extranjeros de la Costa del Sol con **acompañantes lingüísticos** que les asisten —presencialmente o en remoto— en trámites y gestiones donde la barrera del idioma es un problema: ir a la policía, poner una denuncia, una consulta médica en la sanidad pública, la compraventa de una propiedad, gestiones de notaría, banca, Extranjería, etc. También se ofrecen clases de español.

El público no es económicamente vulnerable: son personas con patrimonio o pensión digna que, ante una administración o un médico en español, se quedan sin recursos lingüísticos. La promesa de marca es **“a tu lado, en tu idioma”**: un acompañante de confianza, no un traductor frío.

**Arranque geográfico:** Estepona primero, Marbella después, y por extensión toda la Costa del Sol.

**Idiomas de la interfaz pública:** español, inglés, francés, alemán y neerlandés (es/en/fr/de/nl).

### Modelo de negocio

- Es un **marketplace gestionado**. El operador (superadmin, una sola persona al inicio) **da de alta manualmente** a cada acompañante y personaliza su presencia en la plataforma.
- El operador cobra a cada acompañante: un **setup único** + una **cuota mensual** de suscripción (vía Stripe del operador).
- **El pago del servicio NO pasa por la plataforma.** El cliente paga directamente al acompañante (efectivo/transferencia/lo que acuerden). La plataforma NO gestiona ese dinero, NO usa Stripe Connect, NO retiene comisión sobre el servicio. El único flujo de dinero que toca la plataforma es la cuota que el operador cobra a acompañantes y a anunciantes.
- Segunda línea de ingresos: **Local Partners** — negocios locales (inmobiliarias, clínicas privadas, gestorías, restaurantes, comercios) que pagan una cuota por anunciarse en la plataforma y llegar al público extranjero.

### Roles del sistema

1. **cliente** — busca acompañantes, reserva, deja reseñas. Registro abierto.
1. **acompañante** — presta los servicios. Tiene microsite propio. **Alta manual por el superadmin** (no auto-registro).
1. **anunciante** (Local Partner) — negocio local que se publicita. **Alta manual por el superadmin.**
1. **superadmin** — el operador. Da de alta acompañantes y anunciantes, gestiona suscripciones Stripe, aprueba reseñas si procede, modera.

> Un mismo negocio/persona puede en el futuro ser anunciante Y acompañante, pero en v1 se mantienen como roles separados. Diseñar el esquema sin impedir esa convivencia futura.

-----

## PARTE 2 — Stack tecnológico

Este proyecto adapta la arquitectura de un sistema previo llamado MakiCar (PWA de transporte a demanda con Next.js + Supabase + Stripe). Se reutiliza el patrón; se cambia el dominio de negocio.

|Capa                                                    |Tecnología                                                                                             |
|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
|Framework                                               |**Next.js 16 (App Router)** — Server Components + Server Actions, sin API REST explícita salvo webhooks|
|Lenguaje                                                |**TypeScript** end-to-end, con tipos generados por Supabase                                            |
|Estilos                                                 |**Tailwind CSS** con tokens de diseño como variables CSS                                               |
|Base de datos                                           |**Supabase (PostgreSQL)** — Auth, RLS, triggers, realtime                                              |
|Email                                                   |**Resend**                                                                                             |
|Pagos (cuota operador→acompañante y operador→anunciante)|**Stripe** (cuenta propia del operador)                                                                |
|i18n                                                    |**next-intl** (o equivalente App-Router-compatible) para es/en/fr/de/nl                                |
|Despliegue                                              |**Vercel** + GitHub (CI/CD automático en merge a `main`)                                               |

**Principios de arquitectura (heredados de MakiCar):**

- Server Components leen datos en el servidor (sin round-trip de API).
- Server Actions (`'use server'`) mutan la BD directamente; `revalidatePath` tras cada mutación.
- Supabase gestiona auth, permisos (RLS por rol) y consistencia (triggers SQL).
- Dos clientes Supabase: uno que **respeta RLS** (operaciones de usuario) y uno **admin con `service_role`** que hace bypass de RLS, usado **solo en Server Actions del servidor, nunca en el cliente**.
- Migraciones SQL versionadas y numeradas, aplicadas en orden.
- Componente de calendario flotante propio (evitar `input type="datetime-local"` nativo, inconsistente entre navegadores).

-----

## PARTE 3 — Identidad visual

### Concepto

Una “C” abierta que acoge. Estructura elegante y sobria (confianza, premium) con un acento cálido y humano (empatía). La C no se cierra en círculo: queda abierta como un brazo que recibe, conteniendo un punto-sol que representa a la persona acompañada.

### El símbolo (variante elegida: “A”)

SVG del símbolo principal (la C verde abre a la derecha y abraza un punto terracota):

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M78 26 A34 34 0 1 0 78 74" stroke="#2C4A3B" stroke-width="9" stroke-linecap="round"/>
  <circle cx="60" cy="50" r="8" fill="#C97B4A"/>
</svg>
```

**Aplicación principal: “sobre verde”** — símbolo y logotipo en hueso/sol sobre fondo verde olivo. Es el bloque de marca dominante.

Versión favicon / app icon (cuadrado redondeado verde con la C en hueso y punto sol suave):

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="6" width="88" height="88" rx="22" fill="#2C4A3B"/>
  <path d="M72 32 A26 26 0 1 0 72 68" stroke="#F7F4EF" stroke-width="8" stroke-linecap="round"/>
  <circle cx="58" cy="50" r="6.5" fill="#E0A877"/>
</svg>
```

### Paleta (tokens CSS)

```css
:root{
  --bone:        #F7F4EF;  /* fondo — nunca blanco clínico */
  --bone-2:      #EFEAE1;  /* fondo secundario */
  --green:       #2C4A3B;  /* base, confianza — color dominante */
  --green-deep:  #22392E;  /* hover, fondos profundos */
  --terra:       #C97B4A;  /* acento cálido, sol del sur — escaso */
  --terra-soft:  #E0A877;  /* acento claro */
  --ink:         #2B2724;  /* texto */
  --line:        rgba(43,39,36,.14); /* divisores */
}
```

**Regla de uso del color:** el verde domina (confianza, el olivar sobre la costa); el terracota es el acento ESCASO y cálido (el sol, lo humano, la acogida); el hueso evita la frialdad clínica del blanco puro.

### Tipografías (ambas Google Fonts, sin licencia)

- **Display / titulares / logotipo:** **Fraunces** (serif humanista, carácter literario).
- **Texto / interfaz:** **Plus Jakarta Sans** (sans muy legible en los cinco idiomas; la legibilidad aquí es accesibilidad para usuarios de todas las edades).

### Claim

- ES: “a tu lado, en tu idioma”
- EN: “by your side, in your language”
- FR: “à vos côtés, dans votre langue”
- DE: “an Ihrer Seite, in Ihrer Sprache”
- NL: “aan uw zijde, in uw taal”

### Tono / estética (para la skill frontend-design)

Editorial-mediterráneo refinado. Minimalismo cálido: espacio generoso, serif con alma, fondo hueso, verde profundo, acentos terracota muy medidos. NADA de estética “AI slop” (ni gradientes morados, ni Inter, ni layouts genéricos). Debe transmitir confianza notarial y calidez humana a la vez, y modular el tono entre secciones (más sobrio en trámites legales, más cálido en clases de español).

-----

## PARTE 4 — Catálogo de servicios

Categorías de servicio que ofrece un acompañante (el cliente filtra por ellas). El esquema debe permitir añadir categorías sin migración (tabla `service_categories` o enum extensible).

**Trámites administrativos y legales:**

- Policía / permisos
- Denuncias
- Extranjería / NIE
- Empadronamiento
- Notaría / gestoría
- Banca
- Citas oficiales genéricas

**Salud:**

- Acompañamiento médico (consulta, urgencias, especialista) — explicar síntomas, entender el diagnóstico

**Propiedad:**

- Compraventa de propiedades (visitas, negociación, firma)

**Otros:**

- Interpretación telefónica urgente (remoto)
- Preparación de entrevista de trabajo
- **Clases de español** — adaptadas a nivel: básico, conversación, “español para turistas/residentes”. Reservables por sesión **y** en **paquetes** (bono de p. ej. 5 o 10 clases).

**Modalidades:** presencial y remoto. Cada servicio de un acompañante indica si es presencial, remoto o ambos.

-----

## PARTE 5 — Modelo de datos (esquema conceptual)

> Adaptación del esquema MakiCar. Mantén RLS en todas las tablas, triggers de consistencia, y el trigger que crea `profiles` automáticamente al registrarse un usuario en Auth (rol por defecto `cliente`).

### Tablas principales

**`profiles`** — un perfil por usuario de Auth.

- `id` (uuid, = auth.users), `rol` (‘cliente’ | ‘acompanante’ | ‘anunciante’ | ‘superadmin’, default ‘cliente’), `nombre`, `telefono`, `idioma_preferido` (es/en/fr/de/nl), `created_at`.

**`acompanantes`** — proveedor del servicio. Ficha + microsite.

- `id` (uuid), `profile_id` (uuid → profiles), `slug` (text UNIQUE — para costacompanion.com/slug), `nombre_publico`, `foto_url`, `bio` (multilingüe: jsonb por idioma), `idiomas` (text[] — qué lenguas habla), `zonas` (text[] — Estepona, Marbella, …), `modalidades` (text[] — presencial/remoto), `email_contacto`, `whatsapp`, `titulacion` (text, nullable), `interprete_jurado` (boolean default false), `anios_experiencia` (int, nullable), `imparte_clases` (boolean default false), `valoracion_media` (numeric, mantenida por trigger), `num_resenas` (int, mantenido por trigger), `activo` (boolean default false — el superadmin lo activa), `destacado` (boolean default false), `created_at`.
- **Stripe (cuota del operador):** `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` (default ‘sin_suscripcion’).

**`servicios`** — cada servicio concreto que ofrece un acompañante, con su precio (cada acompañante pone sus precios).

- `id`, `acompanante_id` (→ acompanantes), `categoria` (FK a service_categories), `titulo` (multilingüe jsonb), `descripcion` (multilingüe jsonb), `modalidad` (‘presencial’|‘remoto’|‘ambos’), `precio` (numeric), `unidad_precio` (‘hora’|‘servicio’|‘sesion’), `es_clase` (boolean), `activo` (boolean), `created_at`.

**`paquetes_clases`** — bonos de clases de español (solo para servicios con `es_clase = true`).

- `id`, `servicio_id` (→ servicios), `num_sesiones` (int), `precio_total` (numeric), `activo` (boolean).

**`service_categories`** — catálogo extensible de categorías (clave + nombre multilingüe + grupo: ‘tramites’|‘salud’|‘propiedad’|‘otros’).

**`disponibilidad`** — franjas horarias que el acompañante abre (equivalente a `trips` de MakiCar: slot de tiempo con capacidad).

- `id`, `acompanante_id`, `fecha_hora` (timestamptz), `duracion_min` (int), `modalidad`, `zona`, `estado` (‘abierto’|‘cerrado’), `created_at`.

**`reservas`** — cita concreta de un cliente con un acompañante (equivalente a `bookings`).

- `id`, `acompanante_id`, `cliente_id` (→ profiles), `servicio_id` (→ servicios, nullable), `disponibilidad_id` (→ disponibilidad, nullable), `fecha_hora` (timestamptz), `modalidad`, `zona`, `detalle_servicio` (text, **opcional, dato sensible — ver Parte 8**), `estado` (‘pendiente’|‘confirmada’|‘rechazada’|‘cancelada’|‘completada’), `created_at`, `cancelada_at`.

**`solicitudes`** — solicitud abierta a medida (equivalente a `special_requests`): el cliente describe lo que necesita y el acompañante propone.

- `id`, `acompanante_id`, `cliente_id`, `descripcion` (text), `detalle_servicio` (text, opcional sensible), `fecha_hora_deseada` (timestamptz, nullable), `modalidad`, `zona`, `precio_propuesto` (numeric, nullable — lo fija el acompañante al aceptar), `estado` (‘pendiente’|‘aceptada’|‘rechazada’), `created_at`.

**`resenas`** — valoración de un cliente a un acompañante tras un servicio.

- `id`, `acompanante_id`, `cliente_id`, `reserva_id` (→ reservas, nullable), `puntuacion` (int 1–5), `comentario` (text), `aprobada` (boolean default true — el superadmin puede moderar), `created_at`.
- Trigger: al insertar/aprobar/borrar reseña, recalcular `acompanantes.valoracion_media` y `num_resenas`. La reseña vive en el acompañante (su microsite) y agrega al directorio general.

**`mensajes`** — chat interno entre cliente y acompañante.

- `id`, `reserva_id` (→ reservas, nullable), `solicitud_id` (nullable), `emisor_id` (→ profiles), `receptor_id` (→ profiles), `texto`, `leido` (boolean default false), `created_at`. (Usar Supabase realtime para entrega en vivo, o AutoRefresh como red de seguridad.)

**`anunciantes`** — Local Partners.

- `id`, `profile_id` (→ profiles, nullable si el superadmin los gestiona sin login propio en v1), `nombre_negocio`, `slug` (UNIQUE), `categoria` (‘inmobiliaria’|‘salud’|‘legal’|‘restauracion’|‘comercio’|‘otros’), `descripcion` (multilingüe jsonb), `logo_url`, `web`, `telefono`, `email`, `whatsapp`, `zona` (Estepona/Marbella/otras Costa del Sol), `plan` (‘basico’|‘destacado’), `activo` (boolean default false), `created_at`.
- **Stripe:** `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`.

### RLS (regla general)

- Cada acompañante solo ve/gestiona SUS servicios, disponibilidad, reservas, solicitudes, mensajes (patrón `mi_acompanante_id()` con SECURITY DEFINER, como `mi_conductor_id()` en MakiCar).
- Cada cliente solo ve SUS reservas, solicitudes, mensajes; puede leer fichas públicas de acompañantes activos y reseñas aprobadas.
- Cada anunciante solo ve/gestiona SU ficha.
- El superadmin opera con `service_role` (bypass RLS) desde Server Actions.
- Cuando el código necesita una operación que RLS bloquea (p. ej. recalcular un agregado), usar el cliente admin SOLO en Server Actions.

### Triggers de consistencia

- `valoracion_media` y `num_resenas` en `acompanantes` (al cambiar reseñas).
- Crear fila en `profiles` al alta en Auth.
- (Si se usa capacidad en disponibilidad) sincronizar plazas como en MakiCar.

-----

## PARTE 6 — Precios y facturación (Stripe del operador)

**El operador cobra con SU cuenta Stripe.** Dos productos de suscripción: acompañantes y anunciantes. NO hay Stripe Connect ni pagos entre cliente y acompañante.

### Cuota de acompañante (Modelo “lanzamiento + estándar”)

- **Setup único: 99 €** (cargo único en la primera factura).
- **Cuota lanzamiento (primer año): 19 €/mes.**
- **Cuota estándar (a partir del 2.º año): 39 €/mes.**
- Implementar con `subscriptionSchedules` de Stripe: fase 1 (precio lanzamiento, 1 año) → fase 2 (precio estándar), `end_behavior: 'release'`, `collection_method: 'send_invoice'`, `days_until_due: 30`. El cargo de setup como `add_invoice_items` en la primera factura. Finalizar y enviar la primera factura inmediatamente.

### Cuota de anunciante (Local Partner)

- **Plan Básico: 29 €/mes** — ficha en el directorio Local Partners.
- **Plan Destacado: 79 €/mes** — ficha + posición destacada + banner discreto en el directorio de acompañantes/home.
- Suscripción mensual simple (`send_invoice`, 30 días).

> Todas las cifras son configurables vía variables de entorno (price IDs de Stripe). No hardcodear importes.

### Webhook

`POST /api/webhooks/stripe` — verifica firma, actualiza `stripe_subscription_status` en `acompanantes` o `anunciantes` según el customer. Eventos: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.

-----

## PARTE 7 — Emails (Resend) con plantilla de marca

Centralizar en `src/lib/email.ts`. Fallo silencioso (nunca romper el flujo). Plantilla HTML de marca:

- Cabecera: símbolo “C” sobre banda verde (`--green`), nombre “Costa Companion” en serif.
- Cuerpo: fondo hueso, texto tinta, acentos terracota en botones/enlaces.
- Fuentes email-safe con fallback (Georgia/serif para titulares, Arial/sans para cuerpo — Fraunces y Plus Jakarta no cargan en muchos clientes de correo).
- Pie: datos de Costa Companion, enlace a la plataforma, nota de intermediación.
- **Idioma:** emails al cliente en su `idioma_preferido` (es/en/fr/de/nl); emails al acompañante en es/en.

**Emails a implementar:**

- Acompañante: nueva reserva, nueva solicitud a medida, nuevo mensaje de chat.
- Cliente: reserva confirmada / rechazada, solicitud aceptada (con precio propuesto) / rechazada, recordatorio de cita.
- Operador→acompañante/anunciante: alta y primera factura (vía Stripe).

> **IMPORTANTE (RGPD):** el campo `detalle_servicio` (síntomas, asunto judicial) **NUNCA** debe viajar en un email. Los emails solo notifican que hay una reserva/mensaje; el detalle se consulta dentro de la plataforma.

-----

## PARTE 8 — Legal, privacidad y confianza (CRÍTICO en este negocio)

Debe estar incorporado desde el diseño, no añadido al final.

1. **Intermediación.** La plataforma es **solo intermediaria**: conecta a clientes con acompañantes independientes. NO presta el servicio de interpretación, NO es responsable de la calidad, exactitud o consecuencias de la interpretación, ni de los acuerdos económicos entre cliente y acompañante. Mostrar este aviso de forma clara (registro, fichas, términos).
1. **Intérprete jurado.** Para actos con valor legal (declaraciones ante policía/juzgados, firmas notariales, documentos oficiales) puede requerirse un **intérprete jurado oficial** habilitado por el Ministerio de Asuntos Exteriores. La plataforma debe advertir de ello y dejar claro que un acompañante no jurado no sustituye a un intérprete jurado cuando la ley lo exige. El campo `interprete_jurado` en la ficha ayuda al cliente a filtrar.
1. **RGPD reforzado (categoría especial, art. 9).** Se tratan potencialmente datos de **salud** (acompañamiento médico) y **judiciales** (denuncias). Por tanto:
- Consentimiento explícito y granular en el registro y en cada reserva que pueda implicar datos sensibles.
- El campo `detalle_servicio` es **opcional**, con aviso visible: “No incluya datos que no desee compartir. Esta información solo será visible para el acompañante dentro de la plataforma.”
- `detalle_servicio` nunca viaja por email ni aparece en logs.
- Minimización: no pedir más datos de los necesarios.
- Derechos ARCO/RGPD (acceso, rectificación, supresión, portabilidad) contemplados.
- Cifrado en tránsito y en reposo (Supabase lo provee; documentarlo).
1. **Textos legales en los cinco idiomas:** Términos y Condiciones, Política de Privacidad, Política de Cookies, y el aviso de intermediación. Generar plantillas base en es/en/fr/de/nl (marcando claramente que deben ser revisadas por un profesional jurídico antes de producción).

> Nota para el operador: estas plantillas son un punto de partida. Antes de lanzar, un abogado debe revisar los textos legales, especialmente por el tratamiento de datos de categoría especial.

-----

## PARTE 9 — PLAN DE CONSTRUCCIÓN POR FASES

> Pide a Claude Code una fase cada vez. Verifica que funciona antes de seguir.

### Fase 0 — Cimientos

- Inicializar Next.js 16 (App Router, TypeScript, Tailwind).
- Configurar tokens de diseño (Parte 3) como variables CSS y en `tailwind.config`.
- Integrar Fraunces + Plus Jakarta Sans.
- Crear proyecto Supabase, cliente SSR (respeta RLS) y cliente admin (`service_role`, solo servidor).
- Estructura de carpetas (espejo de MakiCar, adaptada).
- Migración `001_init.sql`: todas las tablas de la Parte 5, RLS activado en todas, funciones helper (`mi_acompanante_id`, `es_acompanante_activo`), trigger de creación de `profiles`.
- Sembrar `service_categories` con el catálogo de la Parte 4.
- Variables de entorno (.env.example).
- Componentes base: símbolo/logo (SVG de la Parte 3), `DateTimePicker` flotante, layout con fondo hueso.
- **Entregable:** proyecto arranca, BD migrada, identidad visual aplicada al layout base.

### Fase 1 — Autenticación y roles

- Supabase Auth: registro/login del cliente (abierto), login de acompañante/anunciante/superadmin.
- Trigger de `profiles` con rol por defecto `cliente`.
- Middleware de protección de rutas por rol.
- Pantalla de perfil del usuario.
- **Entregable:** los cuatro roles pueden entrar y ven lo que les corresponde.

### Fase 2 — Microsites y directorio de acompañantes

- Panel del superadmin: alta manual de acompañante (crea usuario Auth → profile → fila `acompanantes` con slug), edición de ficha, activar/desactivar, marcar destacado.
- Microsite público `costacompanion.com/[slug]`: ficha completa, servicios, reseñas propias, botón de reserva/contacto.
- Directorio general de acompañantes con filtros: **idioma, categoría de servicio, zona, modalidad; orden por valoración**. (Filtros activos para destacados primero.)
- Panel del acompañante (es/en): gestión de su ficha, sus servicios y precios, sus paquetes de clases, su disponibilidad.
- **Entregable:** se pueden crear acompañantes, aparecen en directorio y en su microsite, gestionan su oferta.

### Fase 3 — Reservas y solicitudes

- Cliente reserva una cita concreta (sobre disponibilidad o servicio) → estado `pendiente`.
- Cliente crea solicitud abierta a medida → el acompañante propone precio y acepta/rechaza.
- Acompañante confirma/rechaza reservas desde su panel.
- Campo `detalle_servicio` opcional con el aviso de privacidad (Parte 8).
- Historial: “mis reservas” (cliente) y reservas (acompañante), con estados.
- **Entregable:** flujo completo de reserva y de solicitud a medida, con cambios de estado.

### Fase 4 — Reseñas

- Tras una reserva `completada`, el cliente puede dejar reseña (1–5 + comentario).
- Triggers de agregación (`valoracion_media`, `num_resenas`).
- Reseñas en el microsite del acompañante y agregadas al directorio.
- Moderación opcional por el superadmin.
- **Entregable:** sistema de reseñas operativo desde v1.

### Fase 5 — Chat interno + contacto

- Al confirmar una reserva: mostrar WhatsApp + email del acompañante al cliente.
- Chat interno cliente↔acompañante (tabla `mensajes`, Supabase realtime + AutoRefresh de respaldo).
- Notificación por email de “nuevo mensaje” (sin incluir el contenido sensible).
- **Entregable:** cliente y acompañante pueden comunicarse dentro y fuera de la plataforma.

### Fase 6 — Facturación Stripe (acompañantes)

- Al crear un acompañante: crear customer Stripe + suscripción con `subscriptionSchedules` (lanzamiento 19 €/mes 1 año → estándar 39 €/mes) + setup 99 € en primera factura.
- Webhook `/api/webhooks/stripe` que sincroniza `stripe_subscription_status`.
- Panel del superadmin: ver estado de suscripción de cada acompañante.
- **Entregable:** alta de acompañante genera cobro automático de cuota.

### Fase 7 — Módulo Local Partners (anunciantes)

- Panel del superadmin: alta manual de anunciante (Básico 29 €/mes / Destacado 79 €/mes), con su suscripción Stripe.
- Ficha del anunciante (multilingüe) y su panel de gestión.
- Directorio público **“Local Partners”** filtrable por categoría y zona (priorizando Estepona → Marbella → resto Costa del Sol).
- Espacio destacado discreto (banner) para plan Destacado en directorio de acompañantes/home.
- Webhook Stripe extendido a anunciantes.
- **Entregable:** negocios locales se publicitan y pagan cuota; aparecen en su directorio.

### Fase 8 — Internacionalización (i18n)

- next-intl con es/en/fr/de/nl para toda la interfaz pública del cliente.
- Panel de acompañante en es/en.
- Campos multilingües (jsonb) de bio, servicios, descripciones servidos según idioma, con fallback.
- Selector de idioma; detección por navegador; `idioma_preferido` del perfil.
- **Entregable:** la web pública funciona íntegra en los cinco idiomas.

### Fase 9 — Emails de marca

- Plantilla HTML de marca (Parte 7) en `src/lib/email.ts`.
- Todos los emails de la Parte 7, en el idioma correspondiente.
- Configurar dominio remitente en Resend (DNS de costacompanion.com).
- **Entregable:** notificaciones por email con identidad de marca, multilingües, sin datos sensibles.

### Fase 10 — Legal, RGPD y confianza

- Páginas de Términos, Privacidad, Cookies y aviso de intermediación en los cinco idiomas (plantillas base, marcadas para revisión jurídica).
- Consentimientos explícitos (registro y reservas sensibles).
- Banner de cookies.
- Avisos de intérprete jurado en fichas y reservas de tipo legal.
- Repaso de que `detalle_servicio` no se filtra a emails/logs.
- **Entregable:** plataforma conforme al diseño legal de la Parte 8.

### Fase 11 — Despliegue

- Repo en GitHub, Vercel conectado, CI/CD en `main`.
- Variables de entorno en Vercel.
- Dominio costacompanion.com.
- Webhook de Stripe apuntando a producción.
- DNS de Resend.
- **Entregable:** Costa Companion en producción.

-----

## ANEXO — Variables de entorno (.env.example)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # nunca exponer al cliente

# Email (Resend)
RESEND_API_KEY=

# Stripe del operador (cuota a acompañantes y anunciantes)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Precios acompañante
STRIPE_PRICE_ACOMP_LAUNCH=          # 19 €/mes
STRIPE_PRICE_ACOMP_STANDARD=        # 39 €/mes
STRIPE_PRICE_ACOMP_SETUP=           # 99 € único
# Precios anunciante
STRIPE_PRICE_PARTNER_BASIC=         # 29 €/mes
STRIPE_PRICE_PARTNER_FEATURED=      # 79 €/mes

# App
NEXT_PUBLIC_SITE_URL=https://costacompanion.com
```

-----

### Recordatorios transversales para Claude Code

- Reutiliza los patrones de MakiCar (Server Actions, RLS, cliente admin solo en servidor, triggers, DateTimePicker propio, AutoRefresh).
- No uses Stripe Connect ni gestiones pagos cliente↔acompañante: el único dinero que toca la plataforma es la cuota del operador.
- El verde domina, el terracota es acento escaso. Fondo hueso, nunca blanco puro. Fraunces + Plus Jakarta Sans.
- Datos sensibles (`detalle_servicio`): opcionales, con aviso, nunca por email ni en logs.
- Todo importe configurable por env, nunca hardcodeado.
- Aprobación manual de acompañantes y anunciantes por el superadmin (no auto-publicación).