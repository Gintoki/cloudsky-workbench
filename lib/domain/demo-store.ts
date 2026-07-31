import type { AuthUser } from "@/lib/auth/types";
import type {
  AuditRecord,
  ContentStatus,
  FactInput,
  FactRecord,
  MetricInput,
  MetricRecord,
} from "./types";
import { canTransitionFact } from "@/lib/facts/state-machine";

const now = new Date();
const iso = (minutesAgo: number) =>
  new Date(now.getTime() - minutesAgo * 60_000).toISOString();

const facts: FactRecord[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    primaryCategory: "算力资源",
    secondaryCategory: "资源口径示例",
    title: "活跃 GPU 统计口径（Demo）",
    content:
      "演示记录：活跃 GPU 需满足已纳入资源池、健康检查通过且报告期内可调度。此内容不代表云天畅想真实口径或数据。",
    numericValue: null,
    unit: "张",
    measurementBasis: "演示口径，仅用于产品验收",
    periodLabel: "2026 Q2（Demo）",
    status: "APPROVED",
    ownerName: "投融资总监（Demo）",
    sourceTitle: "Demo Source：产品验收说明",
    sourceQuote: "本记录为虚构示例，不得用于任何外部材料。",
    versionNo: 2,
    updatedAt: iso(38),
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    primaryCategory: "财务数据",
    secondaryCategory: "收入确认",
    title: "收入确认范围说明（Demo）",
    content:
      "演示记录：说明指标库中的收入示例如何区分实际、预算和预测。无真实财务数据。",
    numericValue: null,
    unit: null,
    measurementBasis: "演示口径",
    periodLabel: "FY2026（Demo）",
    status: "PENDING_REVIEW",
    ownerName: "分析师（Demo）",
    sourceTitle: "Demo Source：财务口径模板",
    sourceQuote: "仅供系统功能演示。",
    versionNo: 1,
    updatedAt: iso(91),
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    primaryCategory: "海外业务",
    secondaryCategory: "区域定义",
    title: "海外收入区域划分（Demo）",
    content:
      "演示记录：按客户签约主体所在地划分区域，待审核确认。无真实客户或收入信息。",
    numericValue: null,
    unit: null,
    measurementBasis: "演示口径",
    periodLabel: "当前版本",
    status: "DRAFT",
    ownerName: "分析师（Demo）",
    sourceTitle: "Demo Source：区域划分模板",
    sourceQuote: null,
    versionNo: 1,
    updatedAt: iso(144),
  },
];

const metrics: MetricRecord[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    code: "DEMO_REVENUE",
    name: "营业收入（Demo）",
    periodLabel: "2026 Q2",
    periodStart: "2026-04-01",
    periodEnd: "2026-06-30",
    value: 138,
    unit: "百万元",
    valueType: "ACTUAL",
    scenario: "BASE",
    frequency: "QUARTERLY",
    status: "APPROVED",
    yoy: 0.15,
    qoq: 0.078,
    measurementBasis: "虚构演示数据，不代表公司实际经营情况",
    sourceTitle: "Demo Source：指标验收数据集",
    updatedAt: iso(52),
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    code: "DEMO_GROSS_MARGIN",
    name: "毛利率（Demo）",
    periodLabel: "2026 Q2",
    periodStart: "2026-04-01",
    periodEnd: "2026-06-30",
    value: 0.326,
    unit: "%",
    valueType: "ACTUAL",
    scenario: "BASE",
    frequency: "QUARTERLY",
    status: "APPROVED",
    yoy: 0.021,
    qoq: 0.008,
    measurementBasis: "虚构演示数据，不代表公司实际经营情况",
    sourceTitle: "Demo Source：指标验收数据集",
    updatedAt: iso(52),
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    code: "DEMO_ORDER_BACKLOG",
    name: "在手订单（Demo）",
    periodLabel: "2026 Q3E",
    periodStart: "2026-07-01",
    periodEnd: "2026-09-30",
    value: 310,
    unit: "百万元",
    valueType: "FORECAST",
    scenario: "BASE",
    frequency: "QUARTERLY",
    status: "PENDING_REVIEW",
    yoy: null,
    qoq: 0.069,
    measurementBasis: "虚构预测数据，仅用于权限与审核流程验收",
    sourceTitle: "Demo Source：预测模板",
    updatedAt: iso(83),
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    code: "DEMO_CUSTOMERS",
    name: "客户数量（Demo）",
    periodLabel: "2026 Q2",
    periodStart: "2026-04-01",
    periodEnd: "2026-06-30",
    value: 86,
    unit: "家",
    valueType: "ACTUAL",
    scenario: "BASE",
    frequency: "QUARTERLY",
    status: "DRAFT",
    yoy: 0.132,
    qoq: 0.049,
    measurementBasis: "虚构演示数据",
    sourceTitle: "Demo Source：指标验收数据集",
    updatedAt: iso(118),
  },
];

const audits: AuditRecord[] = [
  {
    id: crypto.randomUUID(),
    actorName: "投融资总监（Demo）",
    action: "APPROVE",
    resourceType: "COMPANY_FACT",
    resourceTitle: "活跃 GPU 统计口径（Demo）",
    requestId: "req_demo_01",
    createdAt: iso(38),
  },
  {
    id: crypto.randomUUID(),
    actorName: "分析师（Demo）",
    action: "SUBMIT_REVIEW",
    resourceType: "COMPANY_FACT",
    resourceTitle: "收入确认范围说明（Demo）",
    requestId: "req_demo_02",
    createdAt: iso(91),
  },
  {
    id: crypto.randomUUID(),
    actorName: "分析师（Demo）",
    action: "UPDATE",
    resourceType: "METRIC_VALUE",
    resourceTitle: "在手订单（Demo） · 2026 Q3E",
    requestId: "req_demo_03",
    createdAt: iso(83),
  },
];

function visibleStatus(user: AuthUser, status: ContentStatus): boolean {
  return user.role !== "VIEWER" || status === "APPROVED";
}

export function listDemoFacts(user: AuthUser): FactRecord[] {
  return facts.filter((fact) => visibleStatus(user, fact.status));
}

export function listDemoMetrics(user: AuthUser): MetricRecord[] {
  return metrics.filter((metric) => visibleStatus(user, metric.status));
}

export function listDemoAudits(): AuditRecord[] {
  return [...audits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function transitionDemoFact(
  user: AuthUser,
  id: string,
  nextStatus: ContentStatus,
): FactRecord {
  const fact = facts.find((item) => item.id === id);
  if (!fact) throw new Error("Fact not found.");
  if (!canTransitionFact(fact.status, nextStatus)) {
    throw new Error("Invalid fact status transition.");
  }
  fact.status = nextStatus;
  fact.versionNo += 1;
  fact.updatedAt = new Date().toISOString();
  audits.unshift({
    id: crypto.randomUUID(),
    actorName: user.displayName,
    action: nextStatus === "APPROVED" ? "APPROVE" : "SUBMIT_REVIEW",
    resourceType: "COMPANY_FACT",
    resourceTitle: fact.title,
    requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: fact.updatedAt,
  });
  return fact;
}

export function createDemoFact(user: AuthUser, input: FactInput): FactRecord {
  const createdAt = new Date().toISOString();
  const fact: FactRecord = {
    id: crypto.randomUUID(),
    primaryCategory: input.primaryCategory,
    secondaryCategory: input.secondaryCategory ?? null,
    title: input.title,
    content: input.content,
    numericValue: input.numericValue ?? null,
    unit: input.unit ?? null,
    measurementBasis: input.measurementBasis,
    periodLabel: input.periodLabel ?? null,
    status: "DRAFT",
    ownerName: user.displayName,
    sourceTitle: input.sourceTitle,
    sourceQuote: input.sourceQuote ?? null,
    versionNo: 1,
    updatedAt: createdAt,
  };
  facts.unshift(fact);
  audits.unshift({
    id: crypto.randomUUID(),
    actorName: user.displayName,
    action: "CREATE",
    resourceType: "COMPANY_FACT",
    resourceTitle: fact.title,
    requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    createdAt,
  });
  return fact;
}

export function updateDemoFact(
  user: AuthUser,
  id: string,
  input: FactInput,
): FactRecord {
  const fact = facts.find((item) => item.id === id);
  if (!fact) throw new Error("Fact not found.");
  if (fact.status !== "DRAFT") {
    throw new Error("Only draft facts can be edited in Phase 1.");
  }
  Object.assign(fact, {
    ...input,
    secondaryCategory: input.secondaryCategory ?? null,
    numericValue: input.numericValue ?? null,
    unit: input.unit ?? null,
    periodLabel: input.periodLabel ?? null,
    sourceQuote: input.sourceQuote ?? null,
    versionNo: fact.versionNo + 1,
    updatedAt: new Date().toISOString(),
  });
  audits.unshift({
    id: crypto.randomUUID(),
    actorName: user.displayName,
    action: "UPDATE",
    resourceType: "COMPANY_FACT",
    resourceTitle: fact.title,
    requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: fact.updatedAt,
  });
  return fact;
}

export function createDemoMetric(
  user: AuthUser,
  input: MetricInput,
): MetricRecord {
  const metric: MetricRecord = {
    id: crypto.randomUUID(),
    code: input.code,
    name: input.name,
    periodLabel: input.periodLabel,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    value: input.value,
    unit: input.unit,
    valueType: input.valueType,
    scenario: input.scenario,
    frequency: input.frequency,
    status: "DRAFT",
    yoy: null,
    qoq: null,
    measurementBasis: input.measurementBasis,
    sourceTitle: input.sourceTitle,
    updatedAt: new Date().toISOString(),
  };
  metrics.unshift(metric);
  audits.unshift({
    id: crypto.randomUUID(),
    actorName: user.displayName,
    action: "CREATE",
    resourceType: "METRIC_VALUE",
    resourceTitle: `${metric.name} · ${metric.periodLabel}`,
    requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: metric.updatedAt,
  });
  return metric;
}

export function updateDemoMetric(
  user: AuthUser,
  id: string,
  input: MetricInput,
): MetricRecord {
  const metric = metrics.find((item) => item.id === id);
  if (!metric) throw new Error("Metric value not found.");
  if (metric.status !== "DRAFT") {
    throw new Error("Only draft metric values can be edited in Phase 1.");
  }
  Object.assign(metric, {
    ...input,
    updatedAt: new Date().toISOString(),
  });
  audits.unshift({
    id: crypto.randomUUID(),
    actorName: user.displayName,
    action: "UPDATE",
    resourceType: "METRIC_VALUE",
    resourceTitle: `${metric.name} · ${metric.periodLabel}`,
    requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: metric.updatedAt,
  });
  return metric;
}

export function demoDashboard(user: AuthUser) {
  const visibleFacts = listDemoFacts(user);
  const visibleMetrics = listDemoMetrics(user);
  return {
    pendingReview:
      user.role === "VIEWER"
        ? 0
        : facts.filter((fact) => fact.status === "PENDING_REVIEW").length +
          metrics.filter((metric) => metric.status === "PENDING_REVIEW").length,
    approvedFacts: visibleFacts.filter((fact) => fact.status === "APPROVED")
      .length,
    metricCount: visibleMetrics.length,
    recentAudits: user.role === "VIEWER" ? [] : listDemoAudits().slice(0, 5),
    metrics: visibleMetrics.filter((metric) => metric.status === "APPROVED"),
  };
}
