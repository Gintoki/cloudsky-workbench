CREATE TABLE "research_annual_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"source_id" uuid,
	"download_url" text NOT NULL,
	"report_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "research_annual_reports" ADD CONSTRAINT "research_annual_reports_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_annual_reports" ADD CONSTRAINT "research_annual_reports_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "research_annual_reports_report_year_uidx" ON "research_annual_reports" USING btree ("report_id","fiscal_year");--> statement-breakpoint
CREATE INDEX "research_annual_reports_report_idx" ON "research_annual_reports" USING btree ("report_id");