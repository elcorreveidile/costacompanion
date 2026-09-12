ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "idioma_preferido_valido";
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "idioma_preferido_valido" CHECK ("profiles"."idioma_preferido" IS NULL OR "profiles"."idioma_preferido" IN ('es','en','fr','de','nl','ru','uk'));
