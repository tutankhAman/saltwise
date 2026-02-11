ALTER TABLE "saltwise_scrape_jobs" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "saltwise_scrape_jobs" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "saltwise_drug_prices" ADD CONSTRAINT "drug_prices_drug_pharmacy_unique" UNIQUE("drug_id","pharmacy_name");--> statement-breakpoint
ALTER TABLE "saltwise_drugs" ADD CONSTRAINT "drugs_brand_name_manufacturer_unique" UNIQUE("brand_name","manufacturer");