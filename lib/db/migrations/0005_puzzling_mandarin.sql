CREATE TABLE "documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reserva_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"acompanante_id" uuid NOT NULL,
	"blob_pathname" text NOT NULL,
	"blob_url" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"nombre_original" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"eliminado_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_reserva_id_reservas_id_fk" FOREIGN KEY ("reserva_id") REFERENCES "public"."reservas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_cliente_id_profiles_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_acompanante_id_acompanantes_id_fk" FOREIGN KEY ("acompanante_id") REFERENCES "public"."acompanantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documentos_reserva_idx" ON "documentos" USING btree ("reserva_id");--> statement-breakpoint
CREATE INDEX "documentos_purga_idx" ON "documentos" USING btree ("created_at");