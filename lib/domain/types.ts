export type ContentStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SUPERSEDED"
  | "ARCHIVED";

export interface FactRecord {
  id: string;
  primaryCategory: string;
  secondaryCategory: string | null;
  title: string;
  content: string;
  numericValue: string | null;
  unit: string | null;
  measurementBasis: string;
  periodLabel: string | null;
  status: ContentStatus;
  ownerName: string;
  sourceTitle: string;
  sourceQuote: string | null;
  versionNo: number;
  updatedAt: string;
}

export interface FactInput {
  primaryCategory: string;
  secondaryCategory?: string | null;
  title: string;
  content: string;
  measurementBasis: string;
  periodLabel?: string | null;
  numericValue?: string | null;
  unit?: string | null;
  sourceTitle: string;
  sourceQuote?: string | null;
}

export interface MetricRecord {
  id: string;
  code: string;
  name: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  unit: string;
  valueType: "ACTUAL" | "BUDGET" | "FORECAST";
  scenario: "BEAR" | "BASE" | "BULL";
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  status: ContentStatus;
  yoy: number | null;
  qoq: number | null;
  measurementBasis: string;
  sourceTitle: string;
  updatedAt: string;
}

export interface MetricInput {
  code: string;
  name: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  unit: string;
  valueType: "ACTUAL" | "BUDGET" | "FORECAST";
  scenario: "BEAR" | "BASE" | "BULL";
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  measurementBasis: string;
  sourceTitle: string;
}

export interface AuditRecord {
  id: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceTitle: string;
  requestId: string;
  createdAt: string;
}

export interface IntelligenceCompanyRef {
  id: string;
  name: string;
  entityType: "COMPANY" | "TOPIC";
  notionPageUrl: string | null;
}

export interface IntelligenceSourceLink {
  label: string;
  url: string;
}

export interface IntelligenceRecord {
  id: string;
  title: string;
  summary: string;
  details: string | null;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  publishedAt: string;
  eventType: string | null;
  relationshipToCloudsky: string | null;
  sourceNote: string | null;
  notionPageUrl: string | null;
  originalUrl: string;
  sourceTitle: string;
  sourceLinks: IntelligenceSourceLink[];
  tags: string[];
  status: ContentStatus;
  companies: IntelligenceCompanyRef[];
  fetchedAt: string;
}

export interface IntelligenceFilters {
  category?: string;
  company?: string;
  sort?: "newest" | "oldest";
}

export interface IntelligenceFacet {
  value: string;
  label: string;
  count: number;
}

export interface IntelligenceListResult {
  items: IntelligenceRecord[];
  categories: IntelligenceFacet[];
  companies: IntelligenceFacet[];
  total: number;
}

export interface ComparableMarketRecord {
  ticker: string;
  name: string;
  market: "US" | "CN" | "HK";
  currency: "USD" | "CNY" | "HKD";
  financialCurrency: "USD" | "CNY" | "HKD";
  price: number | null;
  priceChangePercent: number | null;
  marketCap: number | null;
  revenue: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  priceAsOf: string | null;
  financialPeriod: string | null;
  financialAsOf: string | null;
  dataStatus: "AVAILABLE" | "UNAVAILABLE";
}

export interface ComparableMarketDataResult {
  configured: boolean;
  availability: "LIVE" | "UNAVAILABLE" | "UNCONFIGURED";
  provider: "PUBLIC_SOURCES";
  priceBasis: "PREVIOUS_CLOSE";
  sources: Array<"TENCENT_FINANCE" | "EASTMONEY">;
  fetchedAt: string;
  cacheExpiresAt: string;
  message: string | null;
  items: ComparableMarketRecord[];
}
