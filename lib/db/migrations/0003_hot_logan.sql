CREATE TABLE "config_precios" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor_entero" integer NOT NULL,
	"descripcion" text
);
--> statement-breakpoint
CREATE TABLE "tarifas" (
	"key" text PRIMARY KEY NOT NULL,
	"descripcion" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"importe_cents" integer NOT NULL,
	"unidad" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tarifa_importe_positivo" CHECK ("tarifas"."importe_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "tipos_gestion" (
	"key" text PRIMARY KEY NOT NULL,
	"nombre" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zonas" (
	"key" text PRIMARY KEY NOT NULL,
	"nombre" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recargo_cents" integer DEFAULT 0 NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "idioma_preferido_valido";--> statement-breakpoint
ALTER TABLE "acompanantes" ADD COLUMN "zona_base" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "idioma_preferido_valido" CHECK ("profiles"."idioma_preferido" IS NULL OR "profiles"."idioma_preferido" IN ('es','en','fr','de','nl','ru','uk'));