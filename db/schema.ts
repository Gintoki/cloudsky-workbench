import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const vector1536 = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const userStatusEnum = pgEnum("user_status", [
  "INVITED",
  "ACTIVE",
  "DISABLED",
]);
export const contentStatusEnum = pgEnum("content_status", [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "SUPERSEDED",
  "ARCHIVED",
]);
export const metricValueTypeEnum = pgEnum("metric_value_type", [
  "ACTUAL",
  "BUDGET",
  "FORECAST",
]);
export const scenarioEnum = pgEnum("scenario", ["BEAR", "BASE", "BULL"]);
export const frequencyEnum = pgEnum("frequency", [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
]);

export const researchConclusionEnum = pgEnum("research_conclusion", [
  "POSITIVE_RESEARCH",
  "WATCH",
  "CAUTIOUS",
  "AVOID",
  "INSUFFICIENT_INFORMATION",
]);

export const researchClaimKindEnum = pgEnum("research_claim_kind", [
  "FACT",
  "ESTIMATE",
  "INFERENCE",
  "OPINION",
  "UNKNOWN",
]);

export const researchTrendEnum = pgEnum("research_trend", [
  "WIDENING",
  "STABLE",
  "NARROWING",
  "UNCERTAIN",
]);

export const researchObservationTypeEnum = pgEnum(
  "research_observation_type",
  ["CATALYST", "RISK", "BEAR_CASE", "WATCH_ITEM"],
);

export const researchDimensionEnum = pgEnum("research_dimension", [
  "MARKET",
  "TECHNOLOGY",
  "BUSINESS_MODEL",
]);

export const researchImportanceEnum = pgEnum("research_importance", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const researchConfidenceEnum = pgEnum("research_confidence", [
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export const researchItemStatusEnum = pgEnum("research_item_status", [
  "INBOX",
  "REVIEWED",
  "TRACKING",
  "ACTION_REQUIRED",
  "ARCHIVED",
]);

export const researchOrganizationTypeEnum = pgEnum("research_organization_type", [
  "COMPANY",
  "UNIVERSITY",
  "LAB",
  "INVESTOR",
  "CUSTOMER",
  "GOVERNMENT",
  "OTHER",
]);

export const investorVisibilityEnum = pgEnum("investor_visibility", [
  "PRIVATE",
  "TEAM",
  "MANAGEMENT",
]);

export const investorTypeEnum = pgEnum("investor_type", [
  "INSTITUTION",
  "FUND",
  "STRATEGIC",
  "FAMILY_OFFICE",
  "INDIVIDUAL",
  "OTHER",
]);

export const investorRelationshipStageEnum = pgEnum(
  "investor_relationship_stage",
  ["TARGET", "ENGAGED", "DILIGENCE", "ACTIVE", "PAUSED", "DECLINED"],
);

export const roadshowFormatEnum = pgEnum("roadshow_format", [
  "ONLINE",
  "IN_PERSON",
  "PHONE",
  "CONFERENCE",
  "OTHER",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    status: userStatusEnum("status").default("INVITED").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    invitedBy: uuid("invited_by"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_org_email_uidx").on(
      table.organizationId,
      table.email,
    ),
    index("users_status_idx").on(table.organizationId, table.status),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roles_org_code_uidx").on(table.organizationId, table.code),
  ],
);

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  ...timestamps,
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("sessions_user_expires_idx").on(table.userId, table.expiresAt)],
);

export const loginLogs = pgTable("login_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  emailAttempted: text("email_attempted").notNull(),
  result: text("result").notNull(),
  reason: text("reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id"),
    requestId: text("request_id").notNull(),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    metadataJson: jsonb("metadata_json"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_org_created_idx").on(table.organizationId, table.createdAt),
    index("audit_resource_idx").on(table.resourceType, table.resourceId),
  ],
);

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  storageKey: text("storage_key").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  checksum: text("checksum").notNull(),
  confidentiality: text("confidentiality").default("INTERNAL").notNull(),
  status: text("status").default("ACTIVE").notNull(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    sourceType: text("source_type").notNull(),
    title: text("title").notNull(),
    publisher: text("publisher"),
    url: text("url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    accessedAt: timestamp("accessed_at", { withTimezone: true }),
    documentId: uuid("document_id").references(() => documents.id),
    checksum: text("checksum"),
    ...timestamps,
  },
  (table) => [
    index("sources_checksum_idx").on(table.checksum),
    index("sources_url_idx").on(table.url),
  ],
);

export const investorAccounts = pgTable(
  "investor_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name").notNull(),
    investorType: investorTypeEnum("investor_type")
      .default("INSTITUTION")
      .notNull(),
    relationshipStage: investorRelationshipStageEnum("relationship_stage")
      .default("TARGET")
      .notNull(),
    focus: text("focus"),
    geography: text("geography"),
    website: text("website"),
    notes: text("notes"),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    visibility: investorVisibilityEnum("visibility").default("TEAM").notNull(),
    nextAction: text("next_action"),
    nextActionAt: date("next_action_at"),
    lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("investor_accounts_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
    index("investor_accounts_org_stage_idx").on(
      table.organizationId,
      table.relationshipStage,
    ),
    index("investor_accounts_next_action_idx").on(
      table.organizationId,
      table.nextActionAt,
    ),
    index("investor_accounts_visibility_idx").on(
      table.organizationId,
      table.visibility,
      table.ownerUserId,
    ),
  ],
);

export const investorContacts = pgTable(
  "investor_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    investorAccountId: uuid("investor_account_id")
      .notNull()
      .references(() => investorAccounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    wechat: text("wechat"),
    notes: text("notes"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    index("investor_contacts_account_idx").on(table.investorAccountId),
    index("investor_contacts_org_name_idx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const roadshowRecords = pgTable(
  "roadshow_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    investorAccountId: uuid("investor_account_id")
      .notNull()
      .references(() => investorAccounts.id),
    investorContactId: uuid("investor_contact_id").references(
      () => investorContacts.id,
    ),
    title: text("title").notNull(),
    format: roadshowFormatEnum("format").default("ONLINE").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    durationSeconds: integer("duration_seconds"),
    audioUrl: text("audio_url"),
    transcript: text("transcript"),
    keyTakeaways: text("key_takeaways"),
    nextAction: text("next_action"),
    followUpDueAt: date("follow_up_due_at"),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    visibility: investorVisibilityEnum("visibility").default("TEAM").notNull(),
    ...timestamps,
  },
  (table) => [
    index("roadshow_records_account_occurred_idx").on(
      table.investorAccountId,
      table.occurredAt,
    ),
    index("roadshow_records_org_occurred_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
    index("roadshow_records_visibility_idx").on(
      table.organizationId,
      table.visibility,
      table.ownerUserId,
    ),
  ],
);

export const roadshowTranscriptSegments = pgTable(
  "roadshow_transcript_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roadshowRecordId: uuid("roadshow_record_id")
      .notNull()
      .references(() => roadshowRecords.id, { onDelete: "cascade" }),
    startSeconds: integer("start_seconds").notNull(),
    endSeconds: integer("end_seconds").notNull(),
    speaker: text("speaker"),
    content: text("content").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roadshow_segments_record_order_uidx").on(
      table.roadshowRecordId,
      table.sortOrder,
    ),
    index("roadshow_segments_record_time_idx").on(
      table.roadshowRecordId,
      table.startSeconds,
    ),
  ],
);

export const companyFacts = pgTable(
  "company_facts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    primaryCategory: text("primary_category").notNull(),
    secondaryCategory: text("secondary_category"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    numericValue: numeric("numeric_value", { precision: 24, scale: 6 }),
    unit: text("unit"),
    measurementBasis: text("measurement_basis").notNull(),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    periodLabel: text("period_label"),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    effectiveDate: timestamp("effective_date", { withTimezone: true }),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    currentVersionNo: integer("current_version_no").default(1).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [
    index("facts_org_status_category_idx").on(
      table.organizationId,
      table.status,
      table.primaryCategory,
    ),
    index("facts_updated_idx").on(table.updatedAt),
  ],
);

export const factVersions = pgTable(
  "fact_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    factId: uuid("fact_id")
      .notNull()
      .references(() => companyFacts.id),
    versionNo: integer("version_no").notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    changeSummary: text("change_summary").notNull(),
    status: contentStatusEnum("status").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("fact_versions_fact_no_uidx").on(table.factId, table.versionNo),
  ],
);

export const factSources = pgTable(
  "fact_sources",
  {
    factId: uuid("fact_id")
      .notNull()
      .references(() => companyFacts.id),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    sourceQuote: text("source_quote"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.factId, table.sourceId] })],
);

export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    defaultUnit: text("default_unit").notNull(),
    dataType: text("data_type").default("NUMBER").notNull(),
    measurementBasis: text("measurement_basis").notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("metrics_org_code_uidx").on(table.organizationId, table.code),
  ],
);

export const metricValues = pgTable(
  "metric_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metricId: uuid("metric_id")
      .notNull()
      .references(() => metrics.id),
    valueType: metricValueTypeEnum("value_type").notNull(),
    scenario: scenarioEnum("scenario").default("BASE").notNull(),
    frequency: frequencyEnum("frequency").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    periodLabel: text("period_label").notNull(),
    valueNumeric: numeric("value_numeric", {
      precision: 24,
      scale: 6,
    }).notNull(),
    unit: text("unit").notNull(),
    currency: text("currency"),
    measurementBasis: text("measurement_basis").notNull(),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    sourceId: uuid("source_id").references(() => sources.id),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    versionNo: integer("version_no").default(1).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [
    index("metric_values_lookup_idx").on(
      table.metricId,
      table.scenario,
      table.periodEnd,
    ),
    index("metric_values_status_idx").on(table.status),
  ],
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name").notNull(),
    shortName: text("short_name"),
    country: text("country"),
    industry: text("industry"),
    entityType: text("entity_type").default("COMPANY").notNull(),
    observationScope: text("observation_scope"),
    notionPageUrl: text("notion_page_url"),
    watchRationale: text("watch_rationale"),
    riskFactors: text("risk_factors"),
    internalConclusion: text("internal_conclusion"),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("companies_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const securities = pgTable("securities", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  ticker: text("ticker").notNull(),
  exchange: text("exchange").notNull(),
  currency: text("currency").notNull(),
  securityType: text("security_type").default("EQUITY").notNull(),
  isPrimary: boolean("is_primary").default(true).notNull(),
  ...timestamps,
});

export const stockPrices = pgTable(
  "stock_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id),
    priceDate: date("price_date").notNull(),
    open: numeric("open", { precision: 24, scale: 6 }),
    high: numeric("high", { precision: 24, scale: 6 }),
    low: numeric("low", { precision: 24, scale: 6 }),
    close: numeric("close", { precision: 24, scale: 6 }).notNull(),
    adjustedClose: numeric("adjusted_close", { precision: 24, scale: 6 }),
    volume: numeric("volume", { precision: 30, scale: 2 }),
    turnover: numeric("turnover", { precision: 30, scale: 2 }),
    marketCap: numeric("market_cap", { precision: 30, scale: 2 }),
    sourceId: uuid("source_id").references(() => sources.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("stock_prices_security_date_uidx").on(
      table.securityId,
      table.priceDate,
    ),
  ],
);

export const financialStatements = pgTable("financial_statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  statementType: text("statement_type").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  currency: text("currency").notNull(),
  lineItemsJson: jsonb("line_items_json").notNull(),
  sourceId: uuid("source_id").references(() => sources.id),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  ...timestamps,
});

export const valuationModels = pgTable("valuation_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  modelType: text("model_type").notNull(),
  scenario: scenarioEnum("scenario").default("BASE").notNull(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  versionNo: integer("version_no").default(1).notNull(),
  parentModelId: uuid("parent_model_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  updatedBy: uuid("updated_by")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const valuationAssumptions = pgTable("valuation_assumptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: uuid("model_id")
    .notNull()
    .references(() => valuationModels.id),
  key: text("key").notNull(),
  label: text("label").notNull(),
  year: integer("year"),
  valueNumeric: numeric("value_numeric", { precision: 24, scale: 6 }),
  unit: text("unit"),
  isInput: boolean("is_input").default(true).notNull(),
  formula: text("formula"),
  sourceId: uuid("source_id").references(() => sources.id),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const valuationResults = pgTable("valuation_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: uuid("model_id")
    .notNull()
    .references(() => valuationModels.id),
  key: text("key").notNull(),
  label: text("label").notNull(),
  valueNumeric: numeric("value_numeric", { precision: 24, scale: 6 }),
  unit: text("unit"),
  formula: text("formula"),
  calculationSnapshotJson: jsonb("calculation_snapshot_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const industries = pgTable("industries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: uuid("parent_id"),
  description: text("description"),
  notionPageUrl: text("notion_page_url"),
  ...timestamps,
});

export const intelligenceItems = pgTable(
  "intelligence_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    industryId: uuid("industry_id").references(() => industries.id),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    details: text("details"),
    originalUrl: text("original_url").notNull(),
    notionPageUrl: text("notion_page_url"),
    sourceNote: text("source_note"),
    sourceLinks: jsonb("source_links")
      .$type<Array<{ label: string; url: string }>>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    eventType: text("event_type"),
    importance: integer("importance").default(0).notNull(),
    relationshipToCloudsky: text("relationship_to_cloudsky"),
    potentialImpact: text("potential_impact"),
    analystComment: text("analyst_comment"),
    isRead: boolean("is_read").default(false).notNull(),
    isAdopted: boolean("is_adopted").default(false).notNull(),
    tags: text("tags").array(),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("intelligence_items_org_published_idx").on(
      table.organizationId,
      table.publishedAt,
    ),
    index("intelligence_items_industry_idx").on(table.industryId),
    index("intelligence_items_status_idx").on(table.status),
  ],
);

export const intelligenceItemCompanies = pgTable(
  "intelligence_item_companies",
  {
    intelligenceItemId: uuid("intelligence_item_id")
      .notNull()
      .references(() => intelligenceItems.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
  },
  (table) => [
    primaryKey({
      columns: [table.intelligenceItemId, table.companyId],
    }),
    index("intelligence_item_companies_company_idx").on(table.companyId),
  ],
);

export const narratives = pgTable("narratives", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  currentVersionNo: integer("current_version_no").default(1).notNull(),
  confidentiality: text("confidentiality").default("INTERNAL").notNull(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const narrativeVersions = pgTable("narrative_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  narrativeId: uuid("narrative_id")
    .notNull()
    .references(() => narratives.id),
  versionNo: integer("version_no").notNull(),
  content: text("content").notNull(),
  useCase: text("use_case"),
  audience: text("audience").array(),
  changeSummary: text("change_summary").notNull(),
  reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  question: text("question").notNull(),
  asker: text("asker"),
  askedAt: timestamp("asked_at", { withTimezone: true }),
  category: text("category"),
  confidentiality: text("confidentiality").default("INTERNAL").notNull(),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  ...timestamps,
});

export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id),
  versionNo: integer("version_no").default(1).notNull(),
  originalResponse: text("original_response"),
  finalResponse: text("final_response"),
  responseType: text("response_type").default("INTERNAL_JUDGMENT").notNull(),
  formallyUsed: boolean("formally_used").default(false).notNull(),
  reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count"),
    pageNumber: integer("page_number"),
    embedding: vector1536("embedding"),
    embeddingJson: jsonb("embedding_json"),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("document_chunks_doc_index_uidx").on(
      table.documentId,
      table.chunkIndex,
    ),
  ],
);

export const citations = pgTable("citations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  sourceType: text("source_type").notNull(),
  sourceRecordId: uuid("source_record_id").notNull(),
  documentChunkId: uuid("document_chunk_id").references(
    () => documentChunks.id,
  ),
  quote: text("quote"),
  locatorJson: jsonb("locator_json"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  title: text("title").notNull(),
  taskType: text("task_type").notNull(),
  status: text("status").default("OPEN").notNull(),
  priority: text("priority").default("MEDIUM").notNull(),
  resourceType: text("resource_type"),
  resourceId: uuid("resource_id"),
  assigneeUserId: uuid("assignee_user_id").references(() => users.id),
  dueAt: timestamp("due_at", { withTimezone: true }),
  ...timestamps,
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  body: text("body").notNull(),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  recipientUserId: uuid("recipient_user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  resourceType: text("resource_type"),
  resourceId: uuid("resource_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const researchIndustryModules = pgTable(
  "research_industry_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    definitionJson: jsonb("definition_json")
      .$type<{
        metrics: Array<{
          code: string;
          label: string;
          unit?: string;
          description?: string;
        }>;
      }>()
      .default(sql`'{"metrics":[]}'::jsonb`)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [index("research_industry_modules_active_idx").on(table.isActive)],
);

export const researchReports = pgTable(
  "research_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    industryModuleId: uuid("industry_module_id").references(
      () => researchIndustryModules.id,
    ),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    currentVersionNo: integer("current_version_no").default(1).notNull(),
    conclusion: researchConclusionEnum("conclusion")
      .default("INSUFFICIENT_INFORMATION")
      .notNull(),
    conclusionDate: timestamp("conclusion_date", { withTimezone: true }),
    conclusionSummary: text("conclusion_summary"),
    coreTension: text("core_tension"),
    confidence: integer("confidence"),
    competenceAssessment: text("competence_assessment"),
    predictability3Year: integer("predictability_3_year"),
    predictability5Year: integer("predictability_5_year"),
    predictability10Year: integer("predictability_10_year"),
    valuationStatus: text("valuation_status").default("PENDING").notNull(),
    tagsJson: jsonb("tags_json")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    researchCompleteness: integer("research_completeness").default(0).notNull(),
    lastChangeSummary: text("last_change_summary"),
    needsManualCleanup: boolean("needs_manual_cleanup")
      .default(false)
      .notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("research_reports_org_company_uidx").on(
      table.organizationId,
      table.companyId,
    ),
    index("research_reports_company_idx").on(table.companyId),
    index("research_reports_status_idx").on(table.status),
  ],
);

export const researchSections = pgTable(
  "research_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    code: text("code").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    claimKind: researchClaimKindEnum("claim_kind").default("UNKNOWN").notNull(),
    sourceId: uuid("source_id").references(() => sources.id),
    dataAsOf: timestamp("data_as_of", { withTimezone: true }),
    needsManualCleanup: boolean("needs_manual_cleanup")
      .default(false)
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("research_sections_report_code_uidx").on(
      table.reportId,
      table.code,
    ),
    index("research_sections_report_idx").on(table.reportId),
  ],
);

export const researchAssumptions = pgTable(
  "research_assumptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    title: text("title").notNull(),
    status: text("status").default("OPEN").notNull(),
    supportEvidence: text("support_evidence"),
    counterEvidence: text("counter_evidence"),
    verificationMetric: text("verification_metric"),
    invalidationCondition: text("invalidation_condition"),
    nextReviewAt: date("next_review_at"),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    confidence: integer("confidence"),
    claimKind: researchClaimKindEnum("claim_kind").default("INFERENCE").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("research_assumptions_report_idx").on(table.reportId),
    index("research_assumptions_review_idx").on(table.nextReviewAt),
  ],
);

export const researchMoats = pgTable(
  "research_moats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    moatType: text("moat_type").notNull(),
    strength: integer("strength"),
    trend: researchTrendEnum("trend").default("UNCERTAIN").notNull(),
    evidence: text("evidence"),
    counterEvidence: text("counter_evidence"),
    sustainability: text("sustainability"),
    failureCondition: text("failure_condition"),
    claimKind: researchClaimKindEnum("claim_kind").default("INFERENCE").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("research_moats_report_idx").on(table.reportId)],
);

export const researchMetrics = pgTable(
  "research_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    financialStatementId: uuid("financial_statement_id").references(
      () => financialStatements.id,
    ),
    sourceId: uuid("source_id").references(() => sources.id),
    code: text("code").notNull(),
    label: text("label").notNull(),
    category: text("category").notNull(),
    valueNumeric: numeric("value_numeric", { precision: 24, scale: 6 }),
    unit: text("unit"),
    valueType: metricValueTypeEnum("value_type").default("ACTUAL").notNull(),
    frequency: frequencyEnum("frequency").default("ANNUAL").notNull(),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    isNormalized: boolean("is_normalized").default(false).notNull(),
    anomalyNote: text("anomaly_note"),
    explanation: text("explanation"),
    claimKind: researchClaimKindEnum("claim_kind").default("UNKNOWN").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("research_metrics_report_period_idx").on(
      table.reportId,
      table.periodEnd,
    ),
    index("research_metrics_report_code_idx").on(table.reportId, table.code),
  ],
);

export const researchAnnualReports = pgTable(
  "research_annual_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    fiscalYear: integer("fiscal_year").notNull(),
    sourceId: uuid("source_id").references(() => sources.id),
    downloadUrl: text("download_url").notNull(),
    reportDate: date("report_date"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("research_annual_reports_report_year_uidx").on(
      table.reportId,
      table.fiscalYear,
    ),
    index("research_annual_reports_report_idx").on(table.reportId),
  ],
);

export const researchValuations = pgTable(
  "research_valuations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    valuationModelId: uuid("valuation_model_id").references(
      () => valuationModels.id,
    ),
    sourceId: uuid("source_id").references(() => sources.id),
    method: text("method").notNull(),
    scenario: scenarioEnum("scenario").default("BASE").notNull(),
    status: text("status").default("PENDING").notNull(),
    currency: text("currency"),
    priceNumeric: numeric("price_numeric", { precision: 24, scale: 6 }),
    priceAsOf: date("price_as_of"),
    marketCapNumeric: numeric("market_cap_numeric", { precision: 30, scale: 2 }),
    intrinsicValueLow: numeric("intrinsic_value_low", {
      precision: 30,
      scale: 2,
    }),
    intrinsicValueHigh: numeric("intrinsic_value_high", {
      precision: 30,
      scale: 2,
    }),
    inputsJson: jsonb("inputs_json").default(sql`'{}'::jsonb`).notNull(),
    impliedMarketExpectation: text("implied_market_expectation"),
    sensitivityNote: text("sensitivity_note"),
    claimKind: researchClaimKindEnum("claim_kind").default("UNKNOWN").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("research_valuations_report_idx").on(table.reportId)],
);

export const researchObservations = pgTable(
  "research_observations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    sourceId: uuid("source_id").references(() => sources.id),
    observationType: researchObservationTypeEnum("observation_type").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    status: text("status").default("OPEN").notNull(),
    probability: integer("probability"),
    impact: text("impact"),
    timeWindow: text("time_window"),
    monitorMetric: text("monitor_metric"),
    triggerCondition: text("trigger_condition"),
    claimKind: researchClaimKindEnum("claim_kind").default("INFERENCE").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("research_observations_report_type_idx").on(
      table.reportId,
      table.observationType,
    ),
  ],
);

export const researchClaims = pgTable(
  "research_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    sectionId: uuid("section_id").references(() => researchSections.id),
    title: text("title").notNull(),
    content: text("content").notNull(),
    claimKind: researchClaimKindEnum("claim_kind").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    dataPeriod: text("data_period"),
    dataAsOf: timestamp("data_as_of", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("research_claims_report_idx").on(table.reportId),
    index("research_claims_section_idx").on(table.sectionId),
  ],
);

export const researchClaimSources = pgTable(
  "research_claim_sources",
  {
    claimId: uuid("claim_id")
      .notNull()
      .references(() => researchClaims.id),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    sourceDate: timestamp("source_date", { withTimezone: true }),
    dataPeriod: text("data_period"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceQuote: text("source_quote"),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedBy: uuid("verified_by").references(() => users.id),
  },
  (table) => [
    primaryKey({ columns: [table.claimId, table.sourceId] }),
    index("research_claim_sources_source_idx").on(table.sourceId),
  ],
);

export const researchVersions = pgTable(
  "research_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    versionNo: integer("version_no").notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    changeSummary: text("change_summary").notNull(),
    status: contentStatusEnum("status").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("research_versions_report_no_uidx").on(
      table.reportId,
      table.versionNo,
    ),
    index("research_versions_report_created_idx").on(
      table.reportId,
      table.createdAt,
    ),
  ],
);

export const researchReviews = pgTable(
  "research_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => researchReports.id),
    versionId: uuid("version_id").references(() => researchVersions.id),
    action: text("action").notNull(),
    comment: text("comment"),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("research_reviews_report_idx").on(table.reportId)],
);

export const researchOrganizations = pgTable(
  "research_organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name").notNull(),
    organizationType: researchOrganizationTypeEnum("organization_type")
      .default("OTHER")
      .notNull(),
    country: text("country"),
    website: text("website"),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("research_organizations_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
    index("research_organizations_type_idx").on(
      table.organizationId,
      table.organizationType,
    ),
  ],
);

export const researchItems = pgTable(
  "research_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    dimension: researchDimensionEnum("dimension").notNull(),
    subtype: text("subtype").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    whatHappened: text("what_happened").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    cloudskyImplication: text("cloudsky_implication").notNull(),
    recommendedAction: text("recommended_action").notNull(),
    eventDate: date("event_date").notNull(),
    importance: researchImportanceEnum("importance").default("MEDIUM").notNull(),
    confidence: researchConfidenceEnum("confidence").default("MEDIUM").notNull(),
    status: researchItemStatusEnum("status").default("INBOX").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    nextAction: text("next_action"),
    nextFollowUpDate: date("next_follow_up_date"),
    details: jsonb("details").default(sql`'{}'::jsonb`).notNull(),
    embedding: vector1536("embedding"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    currentVersionNo: integer("current_version_no").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    index("research_items_org_dimension_event_idx").on(
      table.organizationId,
      table.dimension,
      table.eventDate,
    ),
    index("research_items_org_status_follow_up_idx").on(
      table.organizationId,
      table.status,
      table.nextFollowUpDate,
    ),
    index("research_items_org_importance_idx").on(
      table.organizationId,
      table.importance,
    ),
  ],
);

export const researchSources = pgTable(
  "research_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    researchItemId: uuid("research_item_id")
      .notNull()
      .references(() => researchItems.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    filePath: text("file_path"),
    publisher: text("publisher"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    pageNumber: integer("page_number"),
    quotedText: text("quoted_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("research_sources_item_idx").on(table.researchItemId)],
);

export const researchItemOrganizations = pgTable(
  "research_item_organizations",
  {
    researchItemId: uuid("research_item_id")
      .notNull()
      .references(() => researchItems.id, { onDelete: "cascade" }),
    researchOrganizationId: uuid("research_organization_id")
      .notNull()
      .references(() => researchOrganizations.id),
    relationship: text("relationship"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.researchItemId, table.researchOrganizationId] }),
    index("research_item_organizations_org_idx").on(table.researchOrganizationId),
  ],
);

export const researchItemVersions = pgTable(
  "research_item_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    researchItemId: uuid("research_item_id")
      .notNull()
      .references(() => researchItems.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    changeSummary: text("change_summary").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("research_item_versions_item_no_uidx").on(
      table.researchItemId,
      table.versionNo,
    ),
    index("research_item_versions_item_created_idx").on(
      table.researchItemId,
      table.createdAt,
    ),
  ],
);

export const softDeletePredicate = sql`deleted_at is null`;
