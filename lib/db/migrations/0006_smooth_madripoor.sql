CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"plataforma" text DEFAULT 'web' NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text,
	"auth" text,
	"token_fcm" text,
	"user_agent" text,
	"locale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revocada_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_profile_idx" ON "push_subscriptions" USING btree ("profile_id");