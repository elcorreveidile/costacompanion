CREATE TYPE "public"."estado_pago" AS ENUM('no_aplica', 'pendiente_pago', 'pagada', 'pendiente_cobro', 'cobrada', 'reembolsada');--> statement-breakpoint
CREATE TYPE "public"."metodo_pago" AS ENUM('tarjeta', 'efectivo');--> statement-breakpoint
CREATE TYPE "public"."modo_gestion" AS ENUM('remota', 'horas', 'media_jornada', 'jornada');--> statement-breakpoint
CREATE TYPE "public"."politica_cancelacion" AS ENUM('gratuita', 'mitad', 'sin_reembolso', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."tipo_reserva" AS ENUM('gestion', 'clase');--> statement-breakpoint
ALTER TABLE "acompanantes" ADD COLUMN "acepta_gestiones" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "efectivo_bloqueado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "tipo_reserva" "tipo_reserva";--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "modo_gestion" "modo_gestion";--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "tipo_gestion_key" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "idioma_gestion" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "metodo_pago" "metodo_pago";--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "estado_pago" "estado_pago" DEFAULT 'no_aplica' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "precio_total_cents" integer;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "precio_desglose" jsonb;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "moneda" text DEFAULT 'eur' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "stripe_refund_id" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "reembolso_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "politica_aplicada" "politica_cancelacion";--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "cancelada_por" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "cancelada_motivo" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "no_show" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "no_show_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "notas_acompanante" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "enlace_video" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "enlace_video_origen" text;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "push_confirmacion_enviada_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "push_recordatorio_24h_enviado_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "reservas_cliente_fecha_idx" ON "reservas" USING btree ("cliente_id","fecha_hora");--> statement-breakpoint
CREATE INDEX "reservas_acompanante_fecha_idx" ON "reservas" USING btree ("acompanante_id","fecha_hora");--> statement-breakpoint
CREATE INDEX "reservas_recordatorio_idx" ON "reservas" USING btree ("estado","fecha_hora");