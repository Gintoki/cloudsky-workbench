import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import {
  auditLogs,
  companyFacts,
  factSources,
  factVersions,
  metricValues,
  metrics,
  sources,
  users,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth/types";
import {
  canReadInvestorRecord,
  investorVisibilityValues,
  type InvestorVisibility,
} from "@/lib/investor-relations/visibility";
import {
  listDemoAudits,
  listDemoFacts,
  listDemoMetrics,
  createDemoFact,
  createDemoMetric,
  transitionDemoFact,
  updateDemoFact,
  updateDemoMetric,
} from "./demo-store";
import type {
  AuditRecord,
  ContentStatus,
  FactInput,
  FactRecord,
  MetricInput,
  MetricRecord,
} from "./types";
import { canTransitionFact } from "@/lib/facts/state-machine";

function shouldUseDemo(user: AuthUser): boolean {
  return !hasDatabase() || user.email.endsWith("@cloudsky.demo");
}

export async function listFacts(user: AuthUser): Promise<FactRecord[]> {
  if (shouldUseDemo(user)) return listDemoFacts(user);
  const visibility =
    user.role === "VIEWER"
      ? and(
          eq(companyFacts.organizationId, user.organizationId),
          eq(companyFacts.status, "APPROVED"),
          isNull(companyFacts.deletedAt),
        )
      : and(
          eq(companyFacts.organizationId, user.organizationId),
          isNull(companyFacts.deletedAt),
        );
  const rows = await getDb()
    .select({
      id: companyFacts.id,
      primaryCategory: companyFacts.primaryCategory,
      secondaryCategory: companyFacts.secondaryCategory,
      title: companyFacts.title,
      content: companyFacts.content,
      numericValue: companyFacts.numericValue,
      unit: companyFacts.unit,
      measurementBasis: companyFacts.measurementBasis,
      periodLabel: companyFacts.periodLabel,
      status: companyFacts.status,
      versionNo: companyFacts.currentVersionNo,
      updatedAt: companyFacts.updatedAt,
      ownerName: users.displayName,
      sourceTitle: sources.title,
      sourceQuote: factSources.sourceQuote,
    })
    .from(companyFacts)
    .innerJoin(users, eq(users.id, companyFacts.ownerUserId))
    .leftJoin(factSources, eq(factSources.factId, companyFacts.id))
    .leftJoin(sources, eq(sources.id, factSources.sourceId))
    .where(visibility)
    .orderBy(desc(companyFacts.updatedAt));

  return rows.map((row) => ({
    ...row,
    status: row.status as ContentStatus,
    sourceTitle: row.sourceTitle ?? "未关联来源",
    sourceQuote: row.sourceQuote ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function listMetrics(user: AuthUser): Promise<MetricRecord[]> {
  if (shouldUseDemo(user)) return listDemoMetrics(user);
  const visibility =
    user.role === "VIEWER"
      ? and(
          eq(metrics.organizationId, user.organizationId),
          eq(metricValues.status, "APPROVED"),
          isNull(metricValues.deletedAt),
        )
      : and(
          eq(metrics.organizationId, user.organizationId),
          isNull(metricValues.deletedAt),
        );
  const rows = await getDb()
    .select({
      id: metricValues.id,
      code: metrics.code,
      name: metrics.name,
      periodLabel: metricValues.periodLabel,
      periodStart: metricValues.periodStart,
      periodEnd: metricValues.periodEnd,
      value: metricValues.valueNumeric,
      unit: metricValues.unit,
      valueType: metricValues.valueType,
      scenario: metricValues.scenario,
      frequency: metricValues.frequency,
      status: metricValues.status,
      measurementBasis: metricValues.measurementBasis,
      sourceTitle: sources.title,
      updatedAt: metricValues.updatedAt,
    })
    .from(metricValues)
    .innerJoin(metrics, eq(metrics.id, metricValues.metricId))
    .leftJoin(sources, eq(sources.id, metricValues.sourceId))
    .where(visibility)
    .orderBy(desc(metricValues.periodEnd), metrics.name);

  return rows.map((row) => ({
    ...row,
    value: Number(row.value),
    status: row.status as ContentStatus,
    yoy: null,
    qoq: null,
    sourceTitle: row.sourceTitle ?? "未关联来源",
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function listAudits(user: AuthUser): Promise<AuditRecord[]> {
  if (shouldUseDemo(user)) return listDemoAudits();
  const rows = await getDb()
    .select({
      id: auditLogs.id,
      actorName: users.displayName,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceTitle: auditLogs.metadataJson,
      requestId: auditLogs.requestId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(eq(auditLogs.organizationId, user.organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return rows
    .filter((row) => {
      if (![
        "INVESTOR_ACCOUNT",
        "INVESTOR_CONTACT",
        "ROADSHOW_RECORD",
      ].includes(row.resourceType)) {
        return true;
      }
      const metadata = row.resourceTitle;
      if (!metadata || typeof metadata !== "object") return true;
      const visibility = "visibility" in metadata ? metadata.visibility : null;
      const ownerUserId = "ownerUserId" in metadata ? metadata.ownerUserId : null;
      if (
        typeof visibility !== "string" ||
        !investorVisibilityValues.includes(visibility as InvestorVisibility) ||
        typeof ownerUserId !== "string"
      ) {
        return true;
      }
      return canReadInvestorRecord({
        role: user.role,
        userId: user.id,
        ownerUserId,
        visibility: visibility as InvestorVisibility,
      });
    })
    .map((row) => ({
    id: row.id,
    actorName: row.actorName ?? "系统",
    action: row.action,
    resourceType: row.resourceType,
    resourceTitle:
      typeof row.resourceTitle === "object" &&
      row.resourceTitle &&
      "title" in row.resourceTitle
        ? String(row.resourceTitle.title)
        : row.resourceType,
    requestId: row.requestId,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function transitionFact(
  user: AuthUser,
  factId: string,
  nextStatus: "PENDING_REVIEW" | "APPROVED",
): Promise<FactRecord> {
  if (shouldUseDemo(user)) return transitionDemoFact(user, factId, nextStatus);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(companyFacts)
      .where(
        and(
          eq(companyFacts.id, factId),
          eq(companyFacts.organizationId, user.organizationId),
          isNull(companyFacts.deletedAt),
        ),
      )
      .limit(1);
    if (!current) throw new Error("Fact not found.");
    if (!canTransitionFact(current.status, nextStatus)) {
      throw new Error("Invalid fact status transition.");
    }
    const versionNo = current.currentVersionNo + 1;
    await tx.insert(factVersions).values({
      factId,
      versionNo,
      snapshotJson: current,
      changeSummary:
        nextStatus === "APPROVED" ? "审核通过" : "提交审核",
      status: nextStatus,
      createdBy: user.id,
    });
    await tx
      .update(companyFacts)
      .set({
        status: nextStatus,
        currentVersionNo: versionNo,
        reviewerUserId: nextStatus === "APPROVED" ? user.id : null,
        reviewedAt: nextStatus === "APPROVED" ? new Date() : null,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(companyFacts.id, factId));
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: nextStatus === "APPROVED" ? "APPROVE" : "SUBMIT_REVIEW",
      resourceType: "COMPANY_FACT",
      resourceId: factId,
      requestId: crypto.randomUUID(),
      beforeJson: current,
      afterJson: { ...current, status: nextStatus, currentVersionNo: versionNo },
      metadataJson: { title: current.title },
    });
  });
  const records = await listFacts(user);
  const updated = records.find((fact) => fact.id === factId);
  if (!updated) throw new Error("Updated fact not found.");
  return updated;
}

export async function createFact(
  user: AuthUser,
  input: FactInput,
): Promise<FactRecord> {
  if (shouldUseDemo(user)) return createDemoFact(user, input);
  const db = getDb();
  const created = await db.transaction(async (tx) => {
    const [source] = await tx
      .insert(sources)
      .values({
        organizationId: user.organizationId,
        sourceType: "MANUAL",
        title: input.sourceTitle,
      })
      .returning();
    const [fact] = await tx
      .insert(companyFacts)
      .values({
        organizationId: user.organizationId,
        primaryCategory: input.primaryCategory,
        secondaryCategory: input.secondaryCategory,
        title: input.title,
        content: input.content,
        numericValue: input.numericValue,
        unit: input.unit,
        measurementBasis: input.measurementBasis,
        periodLabel: input.periodLabel,
        ownerUserId: user.id,
        status: "DRAFT",
        currentVersionNo: 1,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();
    await tx.insert(factSources).values({
      factId: fact.id,
      sourceId: source.id,
      sourceQuote: input.sourceQuote,
      isPrimary: true,
    });
    await tx.insert(factVersions).values({
      factId: fact.id,
      versionNo: 1,
      snapshotJson: { ...fact, sourceTitle: input.sourceTitle },
      changeSummary: "创建事实",
      status: "DRAFT",
      createdBy: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "COMPANY_FACT",
      resourceId: fact.id,
      requestId: crypto.randomUUID(),
      afterJson: fact,
      metadataJson: { title: fact.title },
    });
    return fact;
  });
  const rows = await listFacts(user);
  const record = rows.find((fact) => fact.id === created.id);
  if (!record) throw new Error("Created fact not found.");
  return record;
}

export async function updateFact(
  user: AuthUser,
  factId: string,
  input: FactInput,
): Promise<FactRecord> {
  if (shouldUseDemo(user)) return updateDemoFact(user, factId, input);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(companyFacts)
      .where(
        and(
          eq(companyFacts.id, factId),
          eq(companyFacts.organizationId, user.organizationId),
          isNull(companyFacts.deletedAt),
        ),
      )
      .limit(1);
    if (!current) throw new Error("Fact not found.");
    if (current.status !== "DRAFT") {
      throw new Error("Only draft facts can be edited in Phase 1.");
    }
    const versionNo = current.currentVersionNo + 1;
    const next = {
      ...current,
      ...input,
      currentVersionNo: versionNo,
      updatedBy: user.id,
      updatedAt: new Date(),
    };
    await tx
      .update(companyFacts)
      .set({
        primaryCategory: input.primaryCategory,
        secondaryCategory: input.secondaryCategory,
        title: input.title,
        content: input.content,
        numericValue: input.numericValue,
        unit: input.unit,
        measurementBasis: input.measurementBasis,
        periodLabel: input.periodLabel,
        currentVersionNo: versionNo,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(companyFacts.id, factId));
    await tx.insert(factVersions).values({
      factId,
      versionNo,
      snapshotJson: next,
      changeSummary: "编辑事实",
      status: "DRAFT",
      createdBy: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "UPDATE",
      resourceType: "COMPANY_FACT",
      resourceId: factId,
      requestId: crypto.randomUUID(),
      beforeJson: current,
      afterJson: next,
      metadataJson: { title: input.title },
    });
  });
  const rows = await listFacts(user);
  const record = rows.find((fact) => fact.id === factId);
  if (!record) throw new Error("Updated fact not found.");
  return record;
}

export async function createMetric(
  user: AuthUser,
  input: MetricInput,
): Promise<MetricRecord> {
  if (shouldUseDemo(user)) return createDemoMetric(user, input);
  const db = getDb();
  const createdId = await db.transaction(async (tx) => {
    const [existingMetric] = await tx
      .select()
      .from(metrics)
      .where(
        and(
          eq(metrics.organizationId, user.organizationId),
          eq(metrics.code, input.code),
          isNull(metrics.deletedAt),
        ),
      )
      .limit(1);
    const metric =
      existingMetric ??
      (
        await tx
          .insert(metrics)
          .values({
            organizationId: user.organizationId,
            code: input.code,
            name: input.name,
            defaultUnit: input.unit,
            measurementBasis: input.measurementBasis,
            ownerUserId: user.id,
          })
          .returning()
      )[0];
    const [source] = await tx
      .insert(sources)
      .values({
        organizationId: user.organizationId,
        sourceType: "MANUAL",
        title: input.sourceTitle,
      })
      .returning();
    const [value] = await tx
      .insert(metricValues)
      .values({
        metricId: metric.id,
        valueType: input.valueType,
        scenario: input.scenario,
        frequency: input.frequency,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        periodLabel: input.periodLabel,
        valueNumeric: String(input.value),
        unit: input.unit,
        measurementBasis: input.measurementBasis,
        status: "DRAFT",
        sourceId: source.id,
        ownerUserId: user.id,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "METRIC_VALUE",
      resourceId: value.id,
      requestId: crypto.randomUUID(),
      afterJson: value,
      metadataJson: { title: `${input.name} · ${input.periodLabel}` },
    });
    return value.id;
  });
  const rows = await listMetrics(user);
  const record = rows.find((metric) => metric.id === createdId);
  if (!record) throw new Error("Created metric value not found.");
  return record;
}

export async function updateMetric(
  user: AuthUser,
  valueId: string,
  input: MetricInput,
): Promise<MetricRecord> {
  if (shouldUseDemo(user)) return updateDemoMetric(user, valueId, input);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        value: metricValues,
        metric: metrics,
      })
      .from(metricValues)
      .innerJoin(metrics, eq(metrics.id, metricValues.metricId))
      .where(
        and(
          eq(metricValues.id, valueId),
          eq(metrics.organizationId, user.organizationId),
          isNull(metricValues.deletedAt),
        ),
      )
      .limit(1);
    if (!current) throw new Error("Metric value not found.");
    if (current.value.status !== "DRAFT") {
      throw new Error("Only draft metric values can be edited in Phase 1.");
    }
    const [source] = await tx
      .insert(sources)
      .values({
        organizationId: user.organizationId,
        sourceType: "MANUAL",
        title: input.sourceTitle,
      })
      .returning();
    await tx
      .update(metrics)
      .set({
        name: input.name,
        defaultUnit: input.unit,
        measurementBasis: input.measurementBasis,
        updatedAt: new Date(),
      })
      .where(eq(metrics.id, current.metric.id));
    await tx
      .update(metricValues)
      .set({
        valueType: input.valueType,
        scenario: input.scenario,
        frequency: input.frequency,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        periodLabel: input.periodLabel,
        valueNumeric: String(input.value),
        unit: input.unit,
        measurementBasis: input.measurementBasis,
        sourceId: source.id,
        versionNo: current.value.versionNo + 1,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(metricValues.id, valueId));
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "UPDATE",
      resourceType: "METRIC_VALUE",
      resourceId: valueId,
      requestId: crypto.randomUUID(),
      beforeJson: current.value,
      afterJson: { ...current.value, ...input },
      metadataJson: { title: `${input.name} · ${input.periodLabel}` },
    });
  });
  const rows = await listMetrics(user);
  const record = rows.find((metric) => metric.id === valueId);
  if (!record) throw new Error("Updated metric value not found.");
  return record;
}
