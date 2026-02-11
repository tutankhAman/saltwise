CREATE TABLE "saltwise_drug_ai_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_id" uuid NOT NULL,
	"cache_type" text NOT NULL,
	"content" jsonb NOT NULL,
	"model" text NOT NULL,
	"salt_composition" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "drug_ai_cache_drug_type_unique" UNIQUE("drug_id","cache_type")
);
--> statement-breakpoint
ALTER TABLE "saltwise_drug_ai_cache" ADD CONSTRAINT "saltwise_drug_ai_cache_drug_id_saltwise_drugs_id_fk" FOREIGN KEY ("drug_id") REFERENCES "public"."saltwise_drugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drug_ai_cache_drug_id_idx" ON "saltwise_drug_ai_cache" USING btree ("drug_id");