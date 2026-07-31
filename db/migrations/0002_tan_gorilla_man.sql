CREATE TABLE "intelligence_item_companies" (
	"intelligence_item_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	CONSTRAINT "intelligence_item_companies_intelligence_item_id_company_id_pk" PRIMARY KEY("intelligence_item_id","company_id")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "entity_type" text DEFAULT 'COMPANY' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "observation_scope" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "notion_page_url" text;--> statement-breakpoint
ALTER TABLE "industries" ADD COLUMN "notion_page_url" text;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "details" text;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "notion_page_url" text;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "source_note" text;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "source_links" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "status" "content_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
UPDATE "intelligence_items" AS item
SET "owner_user_id" = (
	SELECT "id"
	FROM "users"
	WHERE "organization_id" = item."organization_id"
	  AND "deleted_at" IS NULL
	ORDER BY "created_at" ASC
	LIMIT 1
)
WHERE item."owner_user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "intelligence_items" ALTER COLUMN "owner_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "reviewer_user_id" uuid;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intelligence_item_companies" ADD CONSTRAINT "intelligence_item_companies_intelligence_item_id_intelligence_items_id_fk" FOREIGN KEY ("intelligence_item_id") REFERENCES "public"."intelligence_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intelligence_item_companies" ADD CONSTRAINT "intelligence_item_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intelligence_item_companies_company_idx" ON "intelligence_item_companies" USING btree ("company_id");--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD CONSTRAINT "intelligence_items_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD CONSTRAINT "intelligence_items_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_org_name_uidx" ON "companies" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "intelligence_items_org_published_idx" ON "intelligence_items" USING btree ("organization_id","published_at");--> statement-breakpoint
CREATE INDEX "intelligence_items_industry_idx" ON "intelligence_items" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "intelligence_items_status_idx" ON "intelligence_items" USING btree ("status");
