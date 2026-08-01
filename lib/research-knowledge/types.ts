export const researchDimensions = [
  "MARKET",
  "TECHNOLOGY",
  "BUSINESS_MODEL",
] as const;

export type ResearchDimension = (typeof researchDimensions)[number];
export type ResearchImportance = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ResearchConfidence = "LOW" | "MEDIUM" | "HIGH";
export type ResearchItemStatus =
  | "INBOX"
  | "REVIEWED"
  | "TRACKING"
  | "ACTION_REQUIRED"
  | "ARCHIVED";

export const dimensionMeta: Record<
  ResearchDimension,
  { label: string; english: string; description: string }
> = {
  MARKET: {
    label: "市场情况",
    english: "Market Intelligence",
    description: "客户需求、竞争、供需、政策与融资变化。",
  },
  TECHNOLOGY: {
    label: "技术路线",
    english: "Technology Roadmap",
    description: "技术趋势、验证进展和高校科研合作。",
  },
  BUSINESS_MODEL: {
    label: "盈利模式",
    english: "Business Model Intelligence",
    description: "可复制的商业模式、定价与新变现机会。",
  },
};

export const subtypeMeta: Record<ResearchDimension, Record<string, string>> = {
  MARKET: {
    CUSTOMER_DEMAND: "客户需求",
    COMPETITOR: "竞争对手",
    PRICING_AND_SUPPLY: "定价与供给",
    POLICY: "政策",
    FINANCING: "融资",
    PRODUCT_AND_INDUSTRY_EVENT: "产品与行业事件",
  },
  TECHNOLOGY: {
    TECH_TREND: "技术趋势",
    PAPER: "论文",
    OPEN_SOURCE_PROJECT: "开源项目",
    PRODUCT_TECHNOLOGY: "产品技术",
    TECH_VALIDATION: "技术验证",
    ACADEMIC_COLLABORATION: "高校及科研合作",
  },
  BUSINESS_MODEL: {
    BUSINESS_MODEL_CASE: "商业模式案例",
    APPLICATION_SCENARIO: "新场景与变现机会",
    CLOUDSKY_MODEL_DESIGN: "CloudSky 可复制模式",
    PRICING_MODEL: "定价模式",
  },
};

export const technologyTags = [
  "异构GPU调度",
  "分布式推理",
  "推理加速",
  "KV Cache",
  "模型量化",
  "边缘推理",
  "多模态",
  "Agent基础设施",
  "云端与端侧协同",
  "国产芯片适配",
  "实时音视频与AI融合",
] as const;

export const collaborationStages = [
  "RESEARCHING",
  "CONTACT_TO_BE_ESTABLISHED",
  "CONTACTED",
  "DISCUSSION",
  "SOLUTION_DESIGN",
  "POC",
  "FORMAL_COLLABORATION",
  "PAUSED",
] as const;

export const collaborationStageLabels: Record<
  (typeof collaborationStages)[number],
  string
> = {
  RESEARCHING: "调研中",
  CONTACT_TO_BE_ESTABLISHED: "待建立联系",
  CONTACTED: "已联系",
  DISCUSSION: "沟通中",
  SOLUTION_DESIGN: "方案设计",
  POC: "POC",
  FORMAL_COLLABORATION: "正式合作",
  PAUSED: "暂停",
};

export const importanceLabels: Record<ResearchImportance, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "关键",
};

export const confidenceLabels: Record<ResearchConfidence, string> = {
  LOW: "低置信度",
  MEDIUM: "中置信度",
  HIGH: "高置信度",
};

export const statusLabels: Record<ResearchItemStatus, string> = {
  INBOX: "待审阅",
  REVIEWED: "已审阅",
  TRACKING: "跟进中",
  ACTION_REQUIRED: "需要行动",
  ARCHIVED: "已归档",
};

export interface ResearchSourceRecord {
  id: string;
  sourceType: string;
  title: string;
  url: string | null;
  filePath: string | null;
  publisher: string | null;
  publishedAt: string | null;
  pageNumber: number | null;
  quotedText: string | null;
}

export interface ResearchOrganizationRecord {
  id: string;
  name: string;
  organizationType: string;
  country: string | null;
  website: string | null;
  description: string | null;
  relationship: string | null;
}

export interface ResearchVersionRecord {
  id: string;
  versionNo: number;
  changeSummary: string;
  createdByName: string | null;
  createdAt: string;
}

export interface ResearchItemRecord {
  id: string;
  dimension: ResearchDimension;
  subtype: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  cloudskyImplication: string;
  recommendedAction: string;
  eventDate: string;
  importance: ResearchImportance;
  confidence: ResearchConfidence;
  status: ResearchItemStatus;
  ownerName: string | null;
  ownerUserId: string | null;
  nextAction: string | null;
  nextFollowUpDate: string | null;
  details: Record<string, unknown>;
  currentVersionNo: number;
  createdAt: string;
  updatedAt: string;
  sources: ResearchSourceRecord[];
  organizations: ResearchOrganizationRecord[];
  versions?: ResearchVersionRecord[];
  relatedItems?: ResearchItemRecord[];
}

export interface ResearchModuleSummary {
  dimension: ResearchDimension;
  total: number;
  weekNew: number;
  highImportance: number;
  actionRequired: number;
  latestUpdatedAt: string | null;
}

export interface ResearchKnowledgeListResult {
  items: ResearchItemRecord[];
  modules: ResearchModuleSummary[];
  total: number;
  pendingReview: number;
  upcomingFollowUps: ResearchItemRecord[];
  suggestedActions: ResearchItemRecord[];
}

export interface ResearchItemInput {
  dimension: ResearchDimension;
  subtype: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  cloudskyImplication: string;
  recommendedAction: string;
  eventDate: string;
  importance: ResearchImportance;
  confidence: ResearchConfidence;
  status: ResearchItemStatus;
  ownerUserId?: string | null;
  nextAction?: string | null;
  nextFollowUpDate?: string | null;
  details?: Record<string, unknown>;
  organizations: Array<{
    name: string;
    organizationType?: string;
    country?: string | null;
    website?: string | null;
    description?: string | null;
    relationship?: string | null;
  }>;
  sources: Array<{
    sourceType: string;
    title: string;
    url?: string | null;
    filePath?: string | null;
    publisher?: string | null;
    publishedAt?: string | null;
    pageNumber?: number | null;
    quotedText?: string | null;
  }>;
  changeSummary?: string;
}
