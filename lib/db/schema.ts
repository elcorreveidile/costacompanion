import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  index,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Esquema Drizzle — Costa Companion (Neon Postgres).
 *
 * Traducción fiel de supabase/migrations/001–007, con dos cambios de diseño
 * al salir de Supabase:
 *   1. Sin RLS: la autorización pasa a la capa de aplicación (helpers de sesión
 *      + comprobaciones de rol en server actions y middleware).
 *   2. `profiles` deja de referenciar `auth.users`. Es la tabla de usuarios de
 *      Auth.js: se le añaden email, pin_hash y numero_usuario (login por PIN),
 *      además del rol y los datos de perfil.
 *
 * Las tablas de adaptador de Auth.js (accounts, sessions, verification_tokens)
 * y los triggers de agregación de reseñas se añaden en sus fases respectivas.
 */

// ── ENUMs ────────────────────────────────────────────────────────────────────

export const rolUsuario = pgEnum("rol_usuario", [
  "cliente",
  "acompanante",
  "anunciante",
  "superadmin",
]);
export const modalidadServicio = pgEnum("modalidad_servicio", [
  "presencial",
  "remoto",
  "ambos",
]);
export const estadoReserva = pgEnum("estado_reserva", [
  "pendiente",
  "confirmada",
  "rechazada",
  "cancelada",
  "completada",
]);
export const estadoSolicitud = pgEnum("estado_solicitud", [
  "pendiente",
  "aceptada",
  "rechazada",
]);
export const estadoDisponibilidad = pgEnum("estado_disponibilidad", [
  "abierto",
  "cerrado",
]);
export const unidadPrecio = pgEnum("unidad_precio", ["hora", "servicio", "sesion"]);
export const grupoCategoria = pgEnum("grupo_categoria", [
  "tramites",
  "salud",
  "propiedad",
  "otros",
]);
export const categoriaAnunciante = pgEnum("categoria_anunciante", [
  "inmobiliaria",
  "salud",
  "legal",
  "restauracion",
  "comercio",
  "otros",
]);
export const planAnunciante = pgEnum("plan_anunciante", ["basico", "destacado"]);
export const estadoStripe = pgEnum("estado_stripe", [
  "sin_suscripcion",
  "active",
  "past_due",
  "canceled",
  "trialing",
]);

// ── profiles — un registro por usuario (tabla de usuarios de Auth.js) ─────────

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rol: rolUsuario("rol").notNull().default("cliente"),
    nombre: text("nombre"),
    telefono: text("telefono"),
    idiomaPreferido: text("idioma_preferido"),
    // Campos de autenticación (antes vivían en auth.users de Supabase)
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    // Login por PIN (solo acompañantes y admin)
    pinHash: text("pin_hash"),
    numeroUsuario: text("numero_usuario").unique(),
    pinIntentos: integer("pin_intentos").notNull().default(0),
    pinBloqueadoHasta: timestamp("pin_bloqueado_hasta", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "idioma_preferido_valido",
      sql`${t.idiomaPreferido} IS NULL OR ${t.idiomaPreferido} IN ('es','en','fr','de','nl','ru','uk')`
    ),
  ]
);

// ── service_categories — catálogo extensible de categorías ────────────────────

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  grupo: grupoCategoria("grupo").notNull(),
  nombre: jsonb("nombre").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── acompanantes — proveedor del servicio ─────────────────────────────────────

export const acompanantes = pgTable(
  "acompanantes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    nombrePublico: text("nombre_publico").notNull(),
    fotoUrl: text("foto_url"),
    bio: jsonb("bio").default({}),
    idiomas: text("idiomas")
      .array()
      .notNull()
      .default(sql`'{}'`),
    zonas: text("zonas")
      .array()
      .notNull()
      .default(sql`'{}'`),
    modalidades: modalidadServicio("modalidades")
      .array()
      .notNull()
      .default(sql`'{}'`),
    emailContacto: text("email_contacto"),
    whatsapp: text("whatsapp"),
    titulacion: text("titulacion"),
    interpreteJurado: boolean("interprete_jurado").notNull().default(false),
    aniosExperiencia: integer("anios_experiencia"),
    imparteClases: boolean("imparte_clases").notNull().default(false),
    valoracionMedia: numeric("valoracion_media", { precision: 3, scale: 2 }),
    numResenas: integer("num_resenas").notNull().default(0),
    activo: boolean("activo").notNull().default(false),
    destacado: boolean("destacado").notNull().default(false),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeSubscriptionStatus: estadoStripe("stripe_subscription_status")
      .notNull()
      .default("sin_suscripcion"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("acompanantes_activo_destacado_idx").on(t.activo, t.destacado),
    index("acompanantes_profile_id_idx").on(t.profileId),
    check("slug_format", sql`${t.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  ]
);

// ── servicios — oferta concreta de un acompañante ─────────────────────────────

export const servicios = pgTable(
  "servicios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acompananteId: uuid("acompanante_id")
      .notNull()
      .references(() => acompanantes.id, { onDelete: "cascade" }),
    categoria: uuid("categoria")
      .notNull()
      .references(() => serviceCategories.id),
    titulo: jsonb("titulo").notNull().default({}),
    descripcion: jsonb("descripcion").default({}),
    modalidad: modalidadServicio("modalidad").notNull(),
    precio: numeric("precio", { precision: 10, scale: 2 }).notNull(),
    unidadPrecio: unidadPrecio("unidad_precio").notNull().default("hora"),
    esClase: boolean("es_clase").notNull().default(false),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("servicios_acompanante_id_idx").on(t.acompananteId),
    index("servicios_categoria_idx").on(t.categoria),
    check("precio_no_negativo", sql`${t.precio} >= 0`),
  ]
);

// ── paquetes_clases — bonos de clases (servicios con es_clase=true) ────────────

export const paquetesClases = pgTable(
  "paquetes_clases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    servicioId: uuid("servicio_id")
      .notNull()
      .references(() => servicios.id, { onDelete: "cascade" }),
    numSesiones: integer("num_sesiones").notNull(),
    precioTotal: numeric("precio_total", { precision: 10, scale: 2 }).notNull(),
    activo: boolean("activo").notNull().default(true),
  },
  (t) => [
    check("num_sesiones_positivo", sql`${t.numSesiones} > 0`),
    check("precio_total_no_negativo", sql`${t.precioTotal} >= 0`),
  ]
);

// ── disponibilidad — franjas horarias abiertas por el acompañante ─────────────

export const disponibilidad = pgTable(
  "disponibilidad",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acompananteId: uuid("acompanante_id")
      .notNull()
      .references(() => acompanantes.id, { onDelete: "cascade" }),
    fechaHora: timestamp("fecha_hora", { withTimezone: true }).notNull(),
    duracionMin: integer("duracion_min").notNull(),
    modalidad: modalidadServicio("modalidad").notNull(),
    zona: text("zona"),
    estado: estadoDisponibilidad("estado").notNull().default("abierto"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("disponibilidad_acompanante_fecha_idx").on(t.acompananteId, t.fechaHora),
    check("duracion_positiva", sql`${t.duracionMin} > 0`),
  ]
);

// ── reservas — cita concreta cliente ↔ acompañante ────────────────────────────

export const reservas = pgTable(
  "reservas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acompananteId: uuid("acompanante_id")
      .notNull()
      .references(() => acompanantes.id, { onDelete: "restrict" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    servicioId: uuid("servicio_id").references(() => servicios.id, {
      onDelete: "set null",
    }),
    disponibilidadId: uuid("disponibilidad_id").references(
      () => disponibilidad.id,
      { onDelete: "set null" }
    ),
    fechaHora: timestamp("fecha_hora", { withTimezone: true }).notNull(),
    modalidad: modalidadServicio("modalidad").notNull(),
    zona: text("zona"),
    // dato sensible — RGPD art. 9; nunca en emails ni logs
    detalleServicio: text("detalle_servicio"),
    estado: estadoReserva("estado").notNull().default("pendiente"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    canceladaAt: timestamp("cancelada_at", { withTimezone: true }),
  },
  (t) => [
    index("reservas_acompanante_estado_idx").on(t.acompananteId, t.estado),
    index("reservas_cliente_idx").on(t.clienteId),
  ]
);

// ── solicitudes — solicitud a medida del cliente ──────────────────────────────

export const solicitudes = pgTable(
  "solicitudes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acompananteId: uuid("acompanante_id")
      .notNull()
      .references(() => acompanantes.id, { onDelete: "restrict" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    descripcion: text("descripcion").notNull(),
    // dato sensible — RGPD art. 9; nunca en emails ni logs
    detalleServicio: text("detalle_servicio"),
    fechaHoraDeseada: timestamp("fecha_hora_deseada", { withTimezone: true }),
    modalidad: modalidadServicio("modalidad").notNull(),
    zona: text("zona"),
    precioPropuesto: numeric("precio_propuesto", { precision: 10, scale: 2 }),
    estado: estadoSolicitud("estado").notNull().default("pendiente"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("solicitudes_acompanante_estado_idx").on(t.acompananteId, t.estado),
    check(
      "precio_propuesto_no_negativo",
      sql`${t.precioPropuesto} IS NULL OR ${t.precioPropuesto} >= 0`
    ),
  ]
);

// ── resenas — valoración del cliente tras el servicio ─────────────────────────

export const resenas = pgTable(
  "resenas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acompananteId: uuid("acompanante_id")
      .notNull()
      .references(() => acompanantes.id, { onDelete: "cascade" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    reservaId: uuid("reserva_id").references(() => reservas.id, {
      onDelete: "set null",
    }),
    puntuacion: integer("puntuacion").notNull(),
    comentario: text("comentario"),
    aprobada: boolean("aprobada").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("resenas_acompanante_aprobada_idx").on(t.acompananteId, t.aprobada),
    check("puntuacion_rango", sql`${t.puntuacion} BETWEEN 1 AND 5`),
  ]
);

// ── mensajes — chat interno ───────────────────────────────────────────────────

export const mensajes = pgTable(
  "mensajes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservaId: uuid("reserva_id").references(() => reservas.id, {
      onDelete: "set null",
    }),
    solicitudId: uuid("solicitud_id").references(() => solicitudes.id, {
      onDelete: "set null",
    }),
    emisorId: uuid("emisor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    receptorId: uuid("receptor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    texto: text("texto").notNull(),
    leido: boolean("leido").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("mensajes_reserva_idx").on(t.reservaId),
    index("mensajes_emisor_receptor_idx").on(t.emisorId, t.receptorId),
  ]
);

// ── anunciantes — Local Partners ──────────────────────────────────────────────

export const anunciantes = pgTable(
  "anunciantes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    nombreNegocio: text("nombre_negocio").notNull(),
    slug: text("slug").notNull().unique(),
    categoria: categoriaAnunciante("categoria").notNull(),
    descripcion: jsonb("descripcion").default({}),
    logoUrl: text("logo_url"),
    web: text("web"),
    telefono: text("telefono"),
    email: text("email"),
    whatsapp: text("whatsapp"),
    zona: text("zona"),
    direccion: text("direccion"),
    plan: planAnunciante("plan").notNull().default("basico"),
    activo: boolean("activo").notNull().default(false),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeSubscriptionStatus: estadoStripe("stripe_subscription_status")
      .notNull()
      .default("sin_suscripcion"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("anunciantes_activo_plan_idx").on(t.activo, t.plan),
    check("slug_anunciante_format", sql`${t.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  ]
);

// ── solicitudes_acompanante — leads de candidatos a acompañante ───────────────

export const solicitudesAcompanante = pgTable("solicitudes_acompanante", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  telefono: text("telefono"),
  idiomas: text("idiomas")
    .array()
    .notNull()
    .default(sql`'{}'`),
  zona: text("zona"),
  mensaje: text("mensaje"),
  leida: boolean("leida").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Tablas del adaptador de Auth.js ───────────────────────────────────────────
// La tabla de usuarios es `profiles` (arriba). Estas son las auxiliares que
// exige @auth/drizzle-adapter. Con sesión JWT, `sessions` no se usa en runtime
// pero se define para completar el contrato del adaptador.

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);
