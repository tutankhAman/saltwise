CREATE TYPE "public"."scrape_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "saltwise_drug_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_id" uuid NOT NULL,
	"pharmacy_name" text NOT NULL,
	"price" numeric(10, 2),
	"url" text,
	"in_stock" boolean DEFAULT true,
	"last_scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saltwise_drugs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" text NOT NULL,
	"salt_composition" text,
	"salt_id" uuid,
	"strength" text,
	"form" text,
	"manufacturer" text,
	"image_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saltwise_salts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saltwise_scrape_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"status" "scrape_job_status" DEFAULT 'pending' NOT NULL,
	"result_count" numeric DEFAULT '0',
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saltwise_search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"query" text NOT NULL,
	"result_drug_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saltwise_drug_prices" ADD CONSTRAINT "saltwise_drug_prices_drug_id_saltwise_drugs_id_fk" FOREIGN KEY ("drug_id") REFERENCES "public"."saltwise_drugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saltwise_drugs" ADD CONSTRAINT "saltwise_drugs_salt_id_saltwise_salts_id_fk" FOREIGN KEY ("salt_id") REFERENCES "public"."saltwise_salts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saltwise_search_history" ADD CONSTRAINT "saltwise_search_history_result_drug_id_saltwise_drugs_id_fk" FOREIGN KEY ("result_drug_id") REFERENCES "public"."saltwise_drugs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drug_prices_drug_id_idx" ON "saltwise_drug_prices" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "drugs_brand_name_idx" ON "saltwise_drugs" USING btree ("brand_name");--> statement-breakpoint
CREATE INDEX "salts_name_idx" ON "saltwise_salts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scrape_jobs_status_idx" ON "saltwise_scrape_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "search_history_user_id_idx" ON "saltwise_search_history" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "saltwise_conversations" DROP COLUMN "updated_at";