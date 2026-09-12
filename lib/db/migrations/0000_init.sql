CREATE TYPE "public"."categoria_anunciante" AS ENUM('inmobiliaria', 'salud', 'legal', 'restauracion', 'comercio', 'otros');--> statement-breakpoint
CREATE TYPE "public"."estado_disponibilidad" AS ENUM('abierto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."estado_reserva" AS ENUM('pendiente', 'confirmada', 'rechazada', 'cancelada', 'completada');--> statement-breakpoint
CREATE TYPE "public"."estado_solicitud" AS ENUM('pendiente', 'aceptada', 'rechazada');--> statement-breakpoint
CREATE TYPE "public"."estado_stripe" AS ENUM('sin_suscripcion', 'active', 'past_due', 'canceled', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."grupo_categoria" AS ENUM('tramites', 'salud', 'propiedad', 'otros');--> statement-breakpoint
CREATE TYPE "public"."modalidad_servicio" AS ENUM('presencial', 'remoto', 'ambos');--> statement-breakpoint
CREATE TYPE "public"."plan_anunciante" AS ENUM('basico', 'destacado');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('cliente', 'acompanante', 'anunciante', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."unidad_precio" AS ENUM('hora', 'servicio', 'sesion');--> statement-breakpoint
CREATE TABLE "acompanantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"nombre_publico" text NOT NULL,
	"foto_url" text,
	"bio" jsonb DEFAULT '{}'::jsonb,
	"idiomas" text[] DEFAULT '{}' NOT NULL,
	"zonas" text[] DEFAULT '{}' NOT NULL,
	"modalidades" "modalidad_servicio"[] DEFAULT '{}' NOT NULL,
	"email_contacto" text,
	"whatsapp" text,
	"titulacion" text,
	"interprete_jurado" boolean DEFAULT false NOT NULL,
	"anios_experiencia" integer,
	"imparte_clases" boolean DEFAULT false NOT NULL,
	"valoracion_media" numeric(3, 2),
	"num_resenas" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT false NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_subscription_status" "estado_stripe" DEFAULT 'sin_suscripcion' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "acompanantes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "slug_format" CHECK ("acompanantes"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "anunciantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"nombre_negocio" text NOT NULL,
	"slug" text NOT NULL,
	"categoria" "categoria_anunciante" NOT NULL,
	"descripcion" jsonb DEFAULT '{}'::jsonb,
	"logo_url" text,
	"web" text,
	"telefono" text,
	"email" text,
	"whatsapp" text,
	"zona" text,
	"direccion" text,
	"plan" "plan_anunciante" DEFAULT 'basico' NOT NULL,
	"activo" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_subscription_status" "estado_stripe" DEFAULT 'sin_suscripcion' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anunciantes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "slug_anunciante_format" CHECK ("anunciantes"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "disponibilidad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acompanante_id" uuid NOT NULL,
	"fecha_hora" timestamp with time zone NOT NULL,
	"duracion_min" integer NOT NULL,
	"modalidad" "modalidad_servicio" NOT NULL,
	"zona" text,
	"estado" "estado_disponibilidad" DEFAULT 'abierto' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "duracion_positiva" CHECK ("disponibilidad"."duracion_min" > 0)
);
--> statement-breakpoint
CREATE TABLE "mensajes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reserva_id" uuid,
	"solicitud_id" uuid,
	"emisor_id" uuid NOT NULL,
	"receptor_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"leido" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paquetes_clases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"servicio_id" uuid NOT NULL,
	"num_sesiones" integer NOT NULL,
	"precio_total" numeric(10, 2) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "num_sesiones_positivo" CHECK ("paquetes_clases"."num_sesiones" > 0),
	CONSTRAINT "precio_total_no_negativo" CHECK ("paquetes_clases"."precio_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rol" "rol_usuario" DEFAULT 'cliente' NOT NULL,
	"nombre" text,
	"telefono" text,
	"idioma_preferido" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"pin_hash" text,
	"numero_usuario" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "profiles_numero_usuario_unique" UNIQUE("numero_usuario"),
	CONSTRAINT "idioma_preferido_valido" CHECK ("profiles"."idioma_preferido" IS NULL OR "profiles"."idioma_preferido" IN ('es','en','fr','de','nl'))
);
--> statement-breakpoint
CREATE TABLE "resenas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acompanante_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"reserva_id" uuid,
	"puntuacion" integer NOT NULL,
	"comentario" text,
	"aprobada" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "puntuacion_rango" CHECK ("resenas"."puntuacion" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "reservas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acompanante_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servicio_id" uuid,
	"disponibilidad_id" uuid,
	"fecha_hora" timestamp with time zone NOT NULL,
	"modalidad" "modalidad_servicio" NOT NULL,
	"zona" text,
	"detalle_servicio" text,
	"estado" "estado_reserva" DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelada_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"grupo" "grupo_categoria" NOT NULL,
	"nombre" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acompanante_id" uuid NOT NULL,
	"categoria" uuid NOT NULL,
	"titulo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"descripcion" jsonb DEFAULT '{}'::jsonb,
	"modalidad" "modalidad_servicio" NOT NULL,
	"precio" numeric(10, 2) NOT NULL,
	"unidad_precio" "unidad_precio" DEFAULT 'hora' NOT NULL,
	"es_clase" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "precio_no_negativo" CHECK ("servicios"."precio" >= 0)
);
--> statement-breakpoint
CREATE TABLE "solicitudes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acompanante_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"descripcion" text NOT NULL,
	"detalle_servicio" text,
	"fecha_hora_deseada" timestamp with time zone,
	"modalidad" "modalidad_servicio" NOT NULL,
	"zona" text,
	"precio_propuesto" numeric(10, 2),
	"estado" "estado_solicitud" DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "precio_propuesto_no_negativo" CHECK ("solicitudes"."precio_propuesto" IS NULL OR "solicitudes"."precio_propuesto" >= 0)
);
--> statement-breakpoint
CREATE TABLE "solicitudes_acompanante" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"telefono" text,
	"idiomas" text[] DEFAULT '{}' NOT NULL,
	"zona" text,
	"mensaje" text,
	"leida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acompanantes" ADD CONSTRAINT "acompanantes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anunciantes" ADD CONSTRAINT "anunciantes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_acompanante_id_acompanantes_id_fk" FOREIGN KEY ("acompanante_id") REFERENCES "public"."acompanantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_reserva_id_reservas_id_fk" FOREIGN KEY ("reserva_id") REFERENCES "public"."reservas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_solicitud_id_solicitudes_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."solicitudes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_emisor_id_profiles_id_fk" FOREIGN KEY ("emisor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_receptor_id_profiles_id_fk" FOREIGN KEY ("receptor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paquetes_clases" ADD CONSTRAINT "paquetes_clases_servicio_id_servicios_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_acompanante_id_acompanantes_id_fk" FOREIGN KEY ("acompanante_id") REFERENCES "public"."acompanantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_cliente_id_profiles_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_reserva_id_reservas_id_fk" FOREIGN KEY ("reserva_id") REFERENCES "public"."reservas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_acompanante_id_acompanantes_id_fk" FOREIGN KEY ("acompanante_id") REFERENCES "public"."acompanantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_cliente_id_profiles_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_servicio_id_servicios_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_disponibilidad_id_disponibilidad_id_fk" FOREIGN KEY ("disponibilidad_id") REFERENCES "public"."disponibilidad"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_acompanante_id_acompanantes_id_fk" FOREIGN KEY ("acompanante_id") REFERENCES "public"."acompanantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_categoria_service_categories_id_fk" FOREIGN KEY ("categoria") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_acompanante_id_acompanantes_id_fk" FOREIGN KEY ("acompanante_id") REFERENCES "public"."acompanantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_cliente_id_profiles_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acompanantes_activo_destacado_idx" ON "acompanantes" USING btree ("activo","destacado");--> statement-breakpoint
CREATE INDEX "acompanantes_profile_id_idx" ON "acompanantes" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "anunciantes_activo_plan_idx" ON "anunciantes" USING btree ("activo","plan");--> statement-breakpoint
CREATE INDEX "disponibilidad_acompanante_fecha_idx" ON "disponibilidad" USING btree ("acompanante_id","fecha_hora");--> statement-breakpoint
CREATE INDEX "mensajes_reserva_idx" ON "mensajes" USING btree ("reserva_id");--> statement-breakpoint
CREATE INDEX "mensajes_emisor_receptor_idx" ON "mensajes" USING btree ("emisor_id","receptor_id");--> statement-breakpoint
CREATE INDEX "resenas_acompanante_aprobada_idx" ON "resenas" USING btree ("acompanante_id","aprobada");--> statement-breakpoint
CREATE INDEX "reservas_acompanante_estado_idx" ON "reservas" USING btree ("acompanante_id","estado");--> statement-breakpoint
CREATE INDEX "reservas_cliente_idx" ON "reservas" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "servicios_acompanante_id_idx" ON "servicios" USING btree ("acompanante_id");--> statement-breakpoint
CREATE INDEX "servicios_categoria_idx" ON "servicios" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "solicitudes_acompanante_estado_idx" ON "solicitudes" USING btree ("acompanante_id","estado");