export const researchSectionDefinitions = [
  { code: "overview", title: "总览" },
  { code: "business_model", title: "商业模式" },
  { code: "assumptions", title: "核心假设" },
  { code: "industry_competition", title: "行业与竞争" },
  { code: "moat", title: "护城河" },
  { code: "management_governance", title: "管理层与治理" },
  { code: "financial_quality", title: "财务质量" },
  { code: "valuation", title: "估值" },
  { code: "catalysts_risks", title: "催化剂与风险" },
  { code: "monitoring", title: "监控指标" },
] as const;

export const researchConclusionValues = [
  "POSITIVE_RESEARCH",
  "WATCH",
  "CAUTIOUS",
  "AVOID",
  "INSUFFICIENT_INFORMATION",
] as const;
export type ResearchConclusion = (typeof researchConclusionValues)[number];

export const claimKindValues = [
  "FACT",
  "ESTIMATE",
  "INFERENCE",
  "OPINION",
  "UNKNOWN",
] as const;
export type ResearchClaimKind = (typeof claimKindValues)[number];

export type ResearchContentStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SUPERSEDED"
  | "ARCHIVED";

export interface ResearchListItem {
  companyId: string;
  companyName: string;
  shortName: string | null;
  industry: string | null;
  ownerName: string | null;
  reportId: string | null;
  status: ResearchContentStatus | null;
  conclusion: ResearchConclusion | null;
  coreTension: string | null;
  updatedAt: string | null;
  researchCompleteness: number | null;
  valuationStatus: string | null;
  tags: string[];
  openAssumptions: number;
  riskTriggered: boolean;
  needsManualCleanup: boolean;
}

export interface ResearchSectionRecord {
  id: string;
  code: string;
  title: string;
  content: string | null;
  claimKind: ResearchClaimKind;
  dataAsOf: string | null;
  needsManualCleanup: boolean;
  updatedAt: string;
}

export interface ResearchAssumptionRecord {
  id: string;
  title: string;
  status: string;
  supportEvidence: string | null;
  counterEvidence: string | null;
  verificationMetric: string | null;
  invalidationCondition: string | null;
  nextReviewAt: string | null;
  ownerName: string | null;
  confidence: number | null;
  claimKind: ResearchClaimKind;
  updatedAt: string;
}

export interface ResearchMoatRecord {
  id: string;
  moatType: string;
  strength: number | null;
  trend: "WIDENING" | "STABLE" | "NARROWING" | "UNCERTAIN";
  evidence: string | null;
  counterEvidence: string | null;
  sustainability: string | null;
  failureCondition: string | null;
  claimKind: ResearchClaimKind;
}

export interface ResearchMetricRecord {
  id: string;
  code: string;
  label: string;
  category: string;
  value: number | null;
  unit: string | null;
  valueType: "ACTUAL" | "BUDGET" | "FORECAST";
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  periodEnd: string | null;
  isNormalized: boolean;
  anomalyNote: string | null;
  explanation: string | null;
  claimKind: ResearchClaimKind;
  sourceTitle: string | null;
}

export interface ResearchAnnualReportRecord {
  id: string;
  fiscalYear: number;
  reportDate: string | null;
  downloadUrl: string;
  updatedAt: string;
}

export interface ResearchValuationRecord {
  id: string;
  method: string;
  scenario: "BEAR" | "BASE" | "BULL";
  status: string;
  currency: string | null;
  price: number | null;
  priceAsOf: string | null;
  marketCap: number | null;
  intrinsicValueLow: number | null;
  intrinsicValueHigh: number | null;
  impliedMarketExpectation: string | null;
  sensitivityNote: string | null;
  claimKind: ResearchClaimKind;
  sourceTitle: string | null;
}

export interface ResearchObservationRecord {
  id: string;
  observationType: "CATALYST" | "RISK" | "BEAR_CASE" | "WATCH_ITEM";
  title: string;
  content: string | null;
  status: string;
  probability: number | null;
  impact: string | null;
  timeWindow: string | null;
  monitorMetric: string | null;
  triggerCondition: string | null;
  claimKind: ResearchClaimKind;
}

export interface ResearchClaimRecord {
  id: string;
  title: string;
  content: string;
  claimKind: ResearchClaimKind;
  isVerified: boolean;
  dataPeriod: string | null;
  dataAsOf: string | null;
  sources: Array<{
    title: string;
    url: string | null;
    sourceDate: string | null;
    dataPeriod: string | null;
    sourceQuote: string | null;
    isVerified: boolean;
  }>;
}

export interface ResearchVersionRecord {
  id: string;
  versionNo: number;
  changeSummary: string;
  status: ResearchContentStatus;
  createdByName: string | null;
  createdAt: string;
}

export interface CompanyResearchDetail {
  databaseAvailable: boolean;
  company: {
    id: string;
    name: string;
    shortName: string | null;
    industry: string | null;
    country: string | null;
    ticker: string | null;
    exchange: string | null;
  };
  report: {
    id: string;
    status: ResearchContentStatus;
    currentVersionNo: number;
    conclusion: ResearchConclusion;
    conclusionDate: string | null;
    conclusionSummary: string | null;
    coreTension: string | null;
    confidence: number | null;
    competenceAssessment: string | null;
    predictability3Year: number | null;
    predictability5Year: number | null;
    predictability10Year: number | null;
    valuationStatus: string;
    tags: string[];
    researchCompleteness: number;
    lastChangeSummary: string | null;
    needsManualCleanup: boolean;
    ownerName: string | null;
    reviewerName: string | null;
    updatedAt: string;
    industryModuleId: string | null;
  } | null;
  modules: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    metrics: Array<{ code: string; label: string; unit?: string }>;
  }>;
  sections: ResearchSectionRecord[];
  assumptions: ResearchAssumptionRecord[];
  moats: ResearchMoatRecord[];
  metrics: ResearchMetricRecord[];
  annualReports: ResearchAnnualReportRecord[];
  valuations: ResearchValuationRecord[];
  observations: ResearchObservationRecord[];
  claims: ResearchClaimRecord[];
  versions: ResearchVersionRecord[];
  intelligence: Array<{
    id: string;
    title: string;
    summary: string;
    eventType: string | null;
    categoryName: string | null;
    publishedAt: string | null;
    originalUrl: string;
  }>;
}
