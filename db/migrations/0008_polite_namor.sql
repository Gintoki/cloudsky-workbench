CREATE TYPE "public"."investor_visibility" AS ENUM('PRIVATE', 'TEAM', 'MANAGEMENT');--> statement-breakpoint
ALTER TABLE "investor_accounts" ADD COLUMN "visibility" "investor_visibility" DEFAULT 'TEAM' NOT NULL;--> statement-breakpoint
ALTER TABLE "roadshow_records" ADD COLUMN "visibility" "investor_visibility" DEFAULT 'TEAM' NOT NULL;--> statement-breakpoint
CREATE INDEX "investor_accounts_visibility_idx" ON "investor_accounts" USING btree ("organization_id","visibility","owner_user_id");--> statement-breakpoint
CREATE INDEX "roadshow_records_visibility_idx" ON "roadshow_records" USING btree ("organization_id","visibility","owner_user_id");