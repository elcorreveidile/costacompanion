ALTER TABLE "reservas" ALTER COLUMN "acompanante_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "horas" integer;--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "asignado_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "reservas_cola_asignacion_idx" ON "reservas" USING btree ("created_at") WHERE "reservas"."acompanante_id" IS NULL AND "reservas"."tipo_reserva" = 'gestion' AND "reservas"."estado" = 'pendiente';