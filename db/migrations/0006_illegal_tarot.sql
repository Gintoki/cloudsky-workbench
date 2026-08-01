CREATE TYPE "public"."investor_relationship_stage" AS ENUM('TARGET', 'ENGAGED', 'DILIGENCE', 'ACTIVE', 'PAUSED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."investor_type" AS ENUM('INSTITUTION', 'FUND', 'STRATEGIC', 'FAMILY_OFFICE', 'INDIVIDUAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."roadshow_format" AS ENUM('ONLINE', 'IN_PERSON', 'PHONE', 'CONFERENCE', 'OTHER');--> statement-breakpoint
CREATE TABLE "investor_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"investor_type" "investor_type" DEFAULT 'INSTITUTION' NOT NULL,
	"relationship_stage" "investor_relationship_stage" DEFAULT 'TARGET' NOT NULL,
	"focus" text,
	"geography" text,
	"website" text,
	"notes" text,
	"owner_user_id" uuid,
	"next_action" text,
	"next_action_at" date,
	"last_interaction_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "investor_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"investor_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"email" text,
	"phone" text,
	"wechat" text,
	"notes" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "roadshow_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"investor_account_id" uuid NOT NULL,
	"investor_contact_id" uuid,
	"title" text NOT NULL,
	"format" "roadshow_format" DEFAULT 'ONLINE' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer,
	"audio_url" text,
	"transcript" text,
	"key_takeaways" text,
	"next_action" text,
	"follow_up_due_at" date,
	"owner_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "roadshow_transcript_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadshow_record_id" uuid NOT NULL,
	"start_seconds" integer NOT NULL,
	"end_seconds" integer NOT NULL,
	"speaker" text,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "investor_accounts" ADD CONSTRAINT "investor_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_accounts" ADD CONSTRAINT "investor_accounts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_contacts" ADD CONSTRAINT "investor_contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_contacts" ADD CONSTRAINT "investor_contacts_investor_account_id_investor_accounts_id_fk" FOREIGN KEY ("investor_account_id") REFERENCES "public"."investor_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadshow_records" ADD CONSTRAINT "roadshow_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadshow_records" ADD CONSTRAINT "roadshow_records_investor_account_id_investor_accounts_id_fk" FOREIGN KEY ("investor_account_id") REFERENCES "public"."investor_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadshow_records" ADD CONSTRAINT "roadshow_records_investor_contact_id_investor_contacts_id_fk" FOREIGN KEY ("investor_contact_id") REFERENCES "public"."investor_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadshow_records" ADD CONSTRAINT "roadshow_records_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadshow_transcript_segments" ADD CONSTRAINT "roadshow_transcript_segments_roadshow_record_id_roadshow_records_id_fk" FOREIGN KEY ("roadshow_record_id") REFERENCES "public"."roadshow_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "investor_accounts_org_name_uidx" ON "investor_accounts" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "investor_accounts_org_stage_idx" ON "investor_accounts" USING btree ("organization_id","relationship_stage");--> statement-breakpoint
CREATE INDEX "investor_accounts_next_action_idx" ON "investor_accounts" USING btree ("organization_id","next_action_at");--> statement-breakpoint
CREATE INDEX "investor_contacts_account_idx" ON "investor_contacts" USING btree ("investor_account_id");--> statement-breakpoint
CREATE INDEX "investor_contacts_org_name_idx" ON "investor_contacts" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "roadshow_records_account_occurred_idx" ON "roadshow_records" USING btree ("investor_account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "roadshow_records_org_occurred_idx" ON "roadshow_records" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "roadshow_segments_record_order_uidx" ON "roadshow_transcript_segments" USING btree ("roadshow_record_id","sort_order");--> statement-breakpoint
CREATE INDEX "roadshow_segments_record_time_idx" ON "roadshow_transcript_segments" USING btree ("roadshow_record_id","start_seconds");