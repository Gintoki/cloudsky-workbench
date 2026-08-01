CREATE TYPE "public"."research_claim_kind" AS ENUM('FACT', 'ESTIMATE', 'INFERENCE', 'OPINION', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."research_conclusion" AS ENUM('POSITIVE_RESEARCH', 'WATCH', 'CAUTIOUS', 'AVOID', 'INSUFFICIENT_INFORMATION');--> statement-breakpoint
CREATE TYPE "public"."research_observation_type" AS ENUM('CATALYST', 'RISK', 'BEAR_CASE', 'WATCH_ITEM');--> statement-breakpoint
CREATE TYPE "public"."research_trend" AS ENUM('WIDENING', 'STABLE', 'NARROWING', 'UNCERTAIN');--> statement-breakpoint
CREATE TABLE "research_assumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"support_evidence" text,
	"counter_evidence" text,
	"verification_metric" text,
	"invalidation_condition" text,
	"next_review_at" date,
	"owner_user_id" uuid,
	"confidence" integer,
	"claim_kind" "research_claim_kind" DEFAULT 'INFERENCE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_claim_sources" (
	"claim_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_date" timestamp with time zone,
	"data_period" text,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_quote" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	CONSTRAINT "research_claim_sources_claim_id_source_id_pk" PRIMARY KEY("claim_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "research_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"section_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"claim_kind" "research_claim_kind" NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"data_period" text,
	"data_as_of" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_industry_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"definition_json" jsonb DEFAULT '{"metrics":[]}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "research_industry_modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "research_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"financial_statement_id" uuid,
	"source_id" uuid,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"category" text NOT NULL,
	"value_numeric" numeric(24, 6),
	"unit" text,
	"value_type" "metric_value_type" DEFAULT 'ACTUAL' NOT NULL,
	"frequency" "frequency" DEFAULT 'ANNUAL' NOT NULL,
	"period_start" date,
	"period_end" date,
	"is_normalized" boolean DEFAULT false NOT NULL,
	"anomaly_note" text,
	"explanation" text,
	"claim_kind" "research_claim_kind" DEFAULT 'UNKNOWN' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_moats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"moat_type" text NOT NULL,
	"strength" integer,
	"trend" "research_trend" DEFAULT 'UNCERTAIN' NOT NULL,
	"evidence" text,
	"counter_evidence" text,
	"sustainability" text,
	"failure_condition" text,
	"claim_kind" "research_claim_kind" DEFAULT 'INFERENCE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"source_id" uuid,
	"observation_type" "research_observation_type" NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"probability" integer,
	"impact" text,
	"time_window" text,
	"monitor_metric" text,
	"trigger_condition" text,
	"claim_kind" "research_claim_kind" DEFAULT 'INFERENCE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"industry_module_id" uuid,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"current_version_no" integer DEFAULT 1 NOT NULL,
	"conclusion" "research_conclusion" DEFAULT 'INSUFFICIENT_INFORMATION' NOT NULL,
	"conclusion_date" timestamp with time zone,
	"conclusion_summary" text,
	"core_tension" text,
	"confidence" integer,
	"competence_assessment" text,
	"predictability_3_year" integer,
	"predictability_5_year" integer,
	"predictability_10_year" integer,
	"valuation_status" text DEFAULT 'PENDING' NOT NULL,
	"research_completeness" integer DEFAULT 0 NOT NULL,
	"last_change_summary" text,
	"needs_manual_cleanup" boolean DEFAULT false NOT NULL,
	"owner_user_id" uuid,
	"reviewer_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"version_id" uuid,
	"action" text NOT NULL,
	"comment" text,
	"actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"claim_kind" "research_claim_kind" DEFAULT 'UNKNOWN' NOT NULL,
	"source_id" uuid,
	"data_as_of" timestamp with time zone,
	"needs_manual_cleanup" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"valuation_model_id" uuid,
	"source_id" uuid,
	"method" text NOT NULL,
	"scenario" "scenario" DEFAULT 'BASE' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"currency" text,
	"price_numeric" numeric(24, 6),
	"price_as_of" date,
	"market_cap_numeric" numeric(30, 2),
	"intrinsic_value_low" numeric(30, 2),
	"intrinsic_value_high" numeric(30, 2),
	"inputs_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"implied_market_expectation" text,
	"sensitivity_note" text,
	"claim_kind" "research_claim_kind" DEFAULT 'UNKNOWN' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"change_summary" text NOT NULL,
	"status" "content_status" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_assumptions" ADD CONSTRAINT "research_assumptions_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_assumptions" ADD CONSTRAINT "research_assumptions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_claim_sources" ADD CONSTRAINT "research_claim_sources_claim_id_research_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."research_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_claim_sources" ADD CONSTRAINT "research_claim_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_claim_sources" ADD CONSTRAINT "research_claim_sources_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_claims" ADD CONSTRAINT "research_claims_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_claims" ADD CONSTRAINT "research_claims_section_id_research_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."research_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_claims" ADD CONSTRAINT "research_claims_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_metrics" ADD CONSTRAINT "research_metrics_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_metrics" ADD CONSTRAINT "research_metrics_financial_statement_id_financial_statements_id_fk" FOREIGN KEY ("financial_statement_id") REFERENCES "public"."financial_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_metrics" ADD CONSTRAINT "research_metrics_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_moats" ADD CONSTRAINT "research_moats_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_observations" ADD CONSTRAINT "research_observations_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_observations" ADD CONSTRAINT "research_observations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_industry_module_id_research_industry_modules_id_fk" FOREIGN KEY ("industry_module_id") REFERENCES "public"."research_industry_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reviews" ADD CONSTRAINT "research_reviews_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reviews" ADD CONSTRAINT "research_reviews_version_id_research_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."research_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reviews" ADD CONSTRAINT "research_reviews_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sections" ADD CONSTRAINT "research_sections_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sections" ADD CONSTRAINT "research_sections_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_valuations" ADD CONSTRAINT "research_valuations_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_valuations" ADD CONSTRAINT "research_valuations_valuation_model_id_valuation_models_id_fk" FOREIGN KEY ("valuation_model_id") REFERENCES "public"."valuation_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_valuations" ADD CONSTRAINT "research_valuations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_versions" ADD CONSTRAINT "research_versions_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_versions" ADD CONSTRAINT "research_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_assumptions_report_idx" ON "research_assumptions" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "research_assumptions_review_idx" ON "research_assumptions" USING btree ("next_review_at");--> statement-breakpoint
CREATE INDEX "research_claim_sources_source_idx" ON "research_claim_sources" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "research_claims_report_idx" ON "research_claims" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "research_claims_section_idx" ON "research_claims" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "research_industry_modules_active_idx" ON "research_industry_modules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "research_metrics_report_period_idx" ON "research_metrics" USING btree ("report_id","period_end");--> statement-breakpoint
CREATE INDEX "research_metrics_report_code_idx" ON "research_metrics" USING btree ("report_id","code");--> statement-breakpoint
CREATE INDEX "research_moats_report_idx" ON "research_moats" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "research_observations_report_type_idx" ON "research_observations" USING btree ("report_id","observation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "research_reports_org_company_uidx" ON "research_reports" USING btree ("organization_id","company_id");--> statement-breakpoint
CREATE INDEX "research_reports_company_idx" ON "research_reports" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "research_reports_status_idx" ON "research_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "research_reviews_report_idx" ON "research_reviews" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "research_sections_report_code_uidx" ON "research_sections" USING btree ("report_id","code");--> statement-breakpoint
CREATE INDEX "research_sections_report_idx" ON "research_sections" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "research_valuations_report_idx" ON "research_valuations" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "research_versions_report_no_uidx" ON "research_versions" USING btree ("report_id","version_no");--> statement-breakpoint
CREATE INDEX "research_versions_report_created_idx" ON "research_versions" USING btree ("report_id","created_at");
--> statement-breakpoint
INSERT INTO "research_industry_modules" ("code", "name", "description", "definition_json") VALUES
  ('ai-infra', 'AI 大模型 / AI Infra', '模型能力、调用、成本、客户与单位经济模型。', '{"metrics":[{"code":"TOKEN_VOLUME","label":"Token 调用量"},{"code":"INFERENCE_COST","label":"推理成本"},{"code":"API_REVENUE","label":"API 收入"},{"code":"GPU_CAPEX","label":"GPU / 算力资本开支"},{"code":"NET_RETENTION","label":"续费率","unit":"%"}]}'),
  ('semiconductor', '半导体', '技术节点、良率、产能、客户认证和资本开支。', '{"metrics":[{"code":"YIELD","label":"良率","unit":"%"},{"code":"CAPACITY_UTILIZATION","label":"产能利用率","unit":"%"},{"code":"ASP","label":"ASP"},{"code":"INVENTORY_DAYS","label":"库存天数","unit":"天"}]}'),
  ('consumer-ip', '消费品 / IP', '品牌、IP 生命周期、渠道、库存与复购。', '{"metrics":[{"code":"SAME_STORE_GROWTH","label":"同店增速","unit":"%"},{"code":"REPEAT_PURCHASE","label":"复购率","unit":"%"},{"code":"INVENTORY_TURNOVER","label":"库存周转"},{"code":"OVERSEAS_REVENUE","label":"海外收入"}]}'),
  ('gaming', '游戏', '产品储备、用户、流水、变现和研发周期。', '{"metrics":[{"code":"DAU","label":"DAU"},{"code":"MAU","label":"MAU"},{"code":"ARPU","label":"ARPU"},{"code":"DEFERRED_REVENUE","label":"递延收入"}]}'),
  ('saas', 'SaaS / 企业软件', 'ARR、留存、客户结构、获客与回收效率。', '{"metrics":[{"code":"ARR","label":"ARR"},{"code":"NRR","label":"NRR","unit":"%"},{"code":"GROSS_RETENTION","label":"毛收入留存","unit":"%"},{"code":"CAC_PAYBACK","label":"CAC 回收期","unit":"月"}]}'),
  ('manufacturing', '制造业', '产能、成本、订单、客户、营运资本和海外收入。', '{"metrics":[{"code":"CAPACITY","label":"产能"},{"code":"CAPACITY_UTILIZATION","label":"产能利用率","unit":"%"},{"code":"ORDER_BACKLOG","label":"在手订单"},{"code":"RECEIVABLE_DAYS","label":"应收账款天数","unit":"天"}]}'),
  ('baijiu-channel', '白酒及渠道消费', '批价、渠道库存、动销、合同负债与产品结构。', '{"metrics":[{"code":"WHOLESALE_PRICE","label":"批价"},{"code":"CHANNEL_INVENTORY","label":"渠道库存"},{"code":"CONTRACT_LIABILITIES","label":"合同负债"},{"code":"DEALER_COUNT","label":"经销商数量"}]}')
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "definition_json" = EXCLUDED."definition_json",
  "is_active" = true,
  "updated_at" = now();
--> statement-breakpoint
-- Preserve legacy free-text company fields as draft research material. The mapping is
-- additive and idempotent; later analyst edits win because conflicts are ignored.
INSERT INTO "research_reports" (
  "organization_id",
  "company_id",
  "status",
  "current_version_no",
  "conclusion",
  "conclusion_summary",
  "core_tension",
  "needs_manual_cleanup",
  "owner_user_id"
)
SELECT
  c."organization_id",
  c."id",
  'DRAFT',
  1,
  'INSUFFICIENT_INFORMATION',
  NULLIF(trim(c."internal_conclusion"), ''),
  NULLIF(trim(c."watch_rationale"), ''),
  true,
  c."owner_user_id"
FROM "companies" c
WHERE c."deleted_at" IS NULL
  AND (
    NULLIF(trim(c."internal_conclusion"), '') IS NOT NULL
    OR NULLIF(trim(c."watch_rationale"), '') IS NOT NULL
    OR NULLIF(trim(c."risk_factors"), '') IS NOT NULL
  )
ON CONFLICT ("organization_id", "company_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "research_sections" (
  "report_id", "code", "title", "content", "claim_kind", "needs_manual_cleanup", "sort_order"
)
SELECT
  r."id", 'overview', '原有内部结论（待人工整理）', c."internal_conclusion", 'OPINION', true, 0
FROM "research_reports" r
INNER JOIN "companies" c ON c."id" = r."company_id"
WHERE NULLIF(trim(c."internal_conclusion"), '') IS NOT NULL
ON CONFLICT ("report_id", "code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "research_sections" (
  "report_id", "code", "title", "content", "claim_kind", "needs_manual_cleanup", "sort_order"
)
SELECT
  r."id", 'business_model', '原有观察理由（待人工整理）', c."watch_rationale", 'OPINION', true, 1
FROM "research_reports" r
INNER JOIN "companies" c ON c."id" = r."company_id"
WHERE NULLIF(trim(c."watch_rationale"), '') IS NOT NULL
ON CONFLICT ("report_id", "code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "research_sections" (
  "report_id", "code", "title", "content", "claim_kind", "needs_manual_cleanup", "sort_order"
)
SELECT
  r."id", 'catalysts_risks', '原有风险因素（待人工整理）', c."risk_factors", 'OPINION', true, 8
FROM "research_reports" r
INNER JOIN "companies" c ON c."id" = r."company_id"
WHERE NULLIF(trim(c."risk_factors"), '') IS NOT NULL
ON CONFLICT ("report_id", "code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "research_versions" (
  "report_id", "version_no", "snapshot_json", "change_summary", "status", "created_by"
)
SELECT
  r."id",
  1,
  jsonb_build_object('migration', 'legacy_company_fields', 'needsManualCleanup', true),
  '迁移现有公司自由文本，待人工整理',
  'DRAFT',
  r."owner_user_id"
FROM "research_reports" r
WHERE r."needs_manual_cleanup" = true
  AND NOT EXISTS (
    SELECT 1 FROM "research_versions" v
    WHERE v."report_id" = r."id" AND v."version_no" = 1
  );
