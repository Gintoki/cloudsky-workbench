CREATE TYPE "public"."research_confidence" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."research_dimension" AS ENUM('MARKET', 'TECHNOLOGY', 'BUSINESS_MODEL');--> statement-breakpoint
CREATE TYPE "public"."research_importance" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."research_item_status" AS ENUM('INBOX', 'REVIEWED', 'TRACKING', 'ACTION_REQUIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."research_organization_type" AS ENUM('COMPANY', 'UNIVERSITY', 'LAB', 'INVESTOR', 'CUSTOMER', 'GOVERNMENT', 'OTHER');--> statement-breakpoint
CREATE TABLE "research_item_organizations" (
	"research_item_id" uuid NOT NULL,
	"research_organization_id" uuid NOT NULL,
	"relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_item_organizations_research_item_id_research_organization_id_pk" PRIMARY KEY("research_item_id","research_organization_id")
);
--> statement-breakpoint
CREATE TABLE "research_item_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_item_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"change_summary" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dimension" "research_dimension" NOT NULL,
	"subtype" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"what_happened" text NOT NULL,
	"why_it_matters" text NOT NULL,
	"cloudsky_implication" text NOT NULL,
	"recommended_action" text NOT NULL,
	"event_date" date NOT NULL,
	"importance" "research_importance" DEFAULT 'MEDIUM' NOT NULL,
	"confidence" "research_confidence" DEFAULT 'MEDIUM' NOT NULL,
	"status" "research_item_status" DEFAULT 'INBOX' NOT NULL,
	"owner_user_id" uuid,
	"next_action" text,
	"next_follow_up_date" date,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" vector(1536),
	"created_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"current_version_no" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"organization_type" "research_organization_type" DEFAULT 'OTHER' NOT NULL,
	"country" text,
	"website" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_item_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"file_path" text,
	"publisher" text,
	"published_at" timestamp with time zone,
	"page_number" integer,
	"quoted_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_item_organizations" ADD CONSTRAINT "research_item_organizations_research_item_id_research_items_id_fk" FOREIGN KEY ("research_item_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_item_organizations" ADD CONSTRAINT "research_item_organizations_research_organization_id_research_organizations_id_fk" FOREIGN KEY ("research_organization_id") REFERENCES "public"."research_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_item_versions" ADD CONSTRAINT "research_item_versions_research_item_id_research_items_id_fk" FOREIGN KEY ("research_item_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_item_versions" ADD CONSTRAINT "research_item_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_organizations" ADD CONSTRAINT "research_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_research_item_id_research_items_id_fk" FOREIGN KEY ("research_item_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_item_organizations_org_idx" ON "research_item_organizations" USING btree ("research_organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "research_item_versions_item_no_uidx" ON "research_item_versions" USING btree ("research_item_id","version_no");--> statement-breakpoint
CREATE INDEX "research_item_versions_item_created_idx" ON "research_item_versions" USING btree ("research_item_id","created_at");--> statement-breakpoint
CREATE INDEX "research_items_org_dimension_event_idx" ON "research_items" USING btree ("organization_id","dimension","event_date");--> statement-breakpoint
CREATE INDEX "research_items_org_status_follow_up_idx" ON "research_items" USING btree ("organization_id","status","next_follow_up_date");--> statement-breakpoint
CREATE INDEX "research_items_org_importance_idx" ON "research_items" USING btree ("organization_id","importance");--> statement-breakpoint
CREATE UNIQUE INDEX "research_organizations_org_name_uidx" ON "research_organizations" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "research_organizations_type_idx" ON "research_organizations" USING btree ("organization_id","organization_type");--> statement-breakpoint
CREATE INDEX "research_sources_item_idx" ON "research_sources" USING btree ("research_item_id");