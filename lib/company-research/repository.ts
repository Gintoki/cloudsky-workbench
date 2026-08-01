import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import {
  auditLogs,
  companies,
  industries,
  intelligenceItemCompanies,
  intelligenceItems,
  researchAssumptions,
  researchClaimSources,
  researchClaims,
  researchIndustryModules,
  researchAnnualReports,
  researchMetrics,
  researchMoats,
  researchObservations,
  researchReports,
  researchSections,
  researchValuations,
  researchVersions,
  researchReviews,
  securities,
  sources,
  users,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth/types";
import type { z } from "zod";
import {
  createResearchReportSchema,
  researchTransitionSchema,
  updateResearchReportSchema,
} from "./validation";
import {
  researchSectionDefinitions,
  type CompanyResearchDetail,
  type ResearchClaimKind,
  type ResearchContentStatus,
  type ResearchListItem,
} from "./types";

type CreateResearchReportInput = z.infer<typeof createResearchReportSchema>;
type UpdateResearchReportInput = z.infer<typeof updateResearchReportSchema>;
type ResearchTransitionInput = z.infer<typeof researchTransitionSchema>;

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function dateValue(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

function numberValue(value: string | number | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function asClaimKind(value: string): ResearchClaimKind {
  return value as ResearchClaimKind;
}

function asStatus(value: string): ResearchContentStatus {
  return value as ResearchContentStatus;
}

function calculateCompleteness(
  sections: Array<{ content: string | null }>,
  assumptions: Array<unknown>,
): number {
  const completedSections = sections.filter((section) => section.content?.trim())
    .length;
  const sectionProgress = completedSections / researchSectionDefinitions.length;
  const assumptionProgress = Math.min(assumptions.length, 7) / 7;
  return Math.round((sectionProgress * 0.7 + assumptionProgress * 0.3) * 100);
}

async function listModules() {
  const rows = await getDb()
    .select({
      id: researchIndustryModules.id,
      code: researchIndustryModules.code,
      name: researchIndustryModules.name,
      description: researchIndustryModules.description,
      definitionJson: researchIndustryModules.definitionJson,
    })
    .from(researchIndustryModules)
    .where(eq(researchIndustryModules.isActive, true))
    .orderBy(asc(researchIndustryModules.name));
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    metrics: row.definitionJson.metrics.map((metric) => ({
      code: metric.code,
      label: metric.label,
      unit: metric.unit,
    })),
  }));
}

async function ensureCompany(
  user: AuthUser,
  companyId: string,
): Promise<typeof companies.$inferSelect> {
  const [company] = await getDb()
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.id, companyId),
        eq(companies.organizationId, user.organizationId),
        eq(companies.entityType, "COMPANY"),
        isNull(companies.deletedAt),
      ),
    )
    .limit(1);
  if (!company) throw new Error("Company not found.");
  return company;
}

export async function listCompanyResearch(user: AuthUser): Promise<{
  databaseAvailable: boolean;
  items: ResearchListItem[];
}> {
  if (!hasDatabase()) return { databaseAvailable: false, items: [] };

  const reportVisibility =
    user.role === "VIEWER"
      ? and(
          eq(researchReports.organizationId, user.organizationId),
          eq(researchReports.status, "APPROVED"),
          isNull(researchReports.deletedAt),
        )
      : and(
          eq(researchReports.organizationId, user.organizationId),
          isNull(researchReports.deletedAt),
        );
  const rows = await getDb()
    .select({
      companyId: companies.id,
      companyName: companies.name,
      shortName: companies.shortName,
      industry: companies.industry,
      reportId: researchReports.id,
      status: researchReports.status,
      conclusion: researchReports.conclusion,
      coreTension: researchReports.coreTension,
      updatedAt: researchReports.updatedAt,
      researchCompleteness: researchReports.researchCompleteness,
      valuationStatus: researchReports.valuationStatus,
      tags: researchReports.tagsJson,
      needsManualCleanup: researchReports.needsManualCleanup,
      ownerName: users.displayName,
    })
    .from(companies)
    .leftJoin(
      researchReports,
      and(eq(researchReports.companyId, companies.id), reportVisibility),
    )
    .leftJoin(users, eq(users.id, researchReports.ownerUserId))
    .where(
      and(
        eq(companies.organizationId, user.organizationId),
        eq(companies.entityType, "COMPANY"),
        isNull(companies.deletedAt),
      ),
    )
    .orderBy(asc(companies.name));

  const visibleRows = user.role === "VIEWER" ? rows.filter((row) => row.reportId) : rows;
  const reportIds = visibleRows.flatMap((row) => (row.reportId ? [row.reportId] : []));
  const assumptions = reportIds.length
    ? await getDb()
        .select({ reportId: researchAssumptions.reportId, status: researchAssumptions.status })
        .from(researchAssumptions)
        .where(inArray(researchAssumptions.reportId, reportIds))
    : [];
  const observations = reportIds.length
    ? await getDb()
        .select({ reportId: researchObservations.reportId, status: researchObservations.status })
        .from(researchObservations)
        .where(inArray(researchObservations.reportId, reportIds))
    : [];

  return {
    databaseAvailable: true,
    items: visibleRows.map((row) => ({
      companyId: row.companyId,
      companyName: row.companyName,
      shortName: row.shortName,
      industry: row.industry,
      ownerName: row.ownerName,
      reportId: row.reportId,
      status: row.status ? asStatus(row.status) : null,
      conclusion: row.conclusion ?? null,
      coreTension: row.coreTension,
      updatedAt: iso(row.updatedAt),
      researchCompleteness: row.researchCompleteness,
      valuationStatus: row.valuationStatus,
      tags: row.tags ?? [],
      openAssumptions: row.reportId
        ? assumptions.filter(
            (assumption) =>
              assumption.reportId === row.reportId && assumption.status !== "VALIDATED",
          ).length
        : 0,
      riskTriggered: row.reportId
        ? observations.some(
            (observation) =>
              observation.reportId === row.reportId &&
              observation.status === "TRIGGERED",
          )
        : false,
      needsManualCleanup: row.needsManualCleanup ?? false,
    })),
  };
}

export async function getCompanyResearch(
  user: AuthUser,
  companyId: string,
): Promise<CompanyResearchDetail | null> {
  if (!hasDatabase()) return null;
  const company = await ensureCompany(user, companyId);
  const [security] = await getDb()
    .select({ ticker: securities.ticker, exchange: securities.exchange })
    .from(securities)
    .where(and(eq(securities.companyId, companyId), eq(securities.isPrimary, true)))
    .limit(1);
  const reportFilter =
    user.role === "VIEWER"
      ? and(
          eq(researchReports.companyId, companyId),
          eq(researchReports.organizationId, user.organizationId),
          eq(researchReports.status, "APPROVED"),
          isNull(researchReports.deletedAt),
        )
      : and(
          eq(researchReports.companyId, companyId),
          eq(researchReports.organizationId, user.organizationId),
          isNull(researchReports.deletedAt),
        );
  const [report] = await getDb()
    .select()
    .from(researchReports)
    .where(reportFilter)
    .limit(1);
  if (user.role === "VIEWER" && !report) return null;

  const modules = await listModules();
  const base = {
    databaseAvailable: true,
    company: {
      id: company.id,
      name: company.name,
      shortName: company.shortName,
      industry: company.industry,
      country: company.country,
      ticker: security?.ticker ?? null,
      exchange: security?.exchange ?? null,
    },
    modules,
  };
  if (!report) {
    return {
      ...base,
      report: null,
      sections: [],
      assumptions: [],
      moats: [],
      metrics: [],
      annualReports: [],
      valuations: [],
      observations: [],
      claims: [],
      versions: [],
      intelligence: [],
    };
  }

  const db = getDb();
  const [owner, reviewer, sectionRows, assumptionRows, moatRows, metricRows, annualReportRows, valuationRows, observationRows, claimRows, versionRows, intelligenceRows] =
    await Promise.all([
      report.ownerUserId
        ? db
            .select({ displayName: users.displayName })
            .from(users)
            .where(eq(users.id, report.ownerUserId))
            .limit(1)
        : Promise.resolve([]),
      report.reviewerUserId
        ? db
            .select({ displayName: users.displayName })
            .from(users)
            .where(eq(users.id, report.reviewerUserId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(researchSections)
        .where(eq(researchSections.reportId, report.id))
        .orderBy(asc(researchSections.sortOrder)),
      db
        .select({
          value: researchAssumptions,
          ownerName: users.displayName,
        })
        .from(researchAssumptions)
        .leftJoin(users, eq(users.id, researchAssumptions.ownerUserId))
        .where(eq(researchAssumptions.reportId, report.id))
        .orderBy(asc(researchAssumptions.sortOrder)),
      db
        .select()
        .from(researchMoats)
        .where(eq(researchMoats.reportId, report.id))
        .orderBy(asc(researchMoats.sortOrder)),
      db
        .select({ value: researchMetrics, sourceTitle: sources.title })
        .from(researchMetrics)
        .leftJoin(sources, eq(sources.id, researchMetrics.sourceId))
        .where(eq(researchMetrics.reportId, report.id))
        .orderBy(desc(researchMetrics.periodEnd), asc(researchMetrics.sortOrder)),
      db
        .select({
          id: researchAnnualReports.id,
          fiscalYear: researchAnnualReports.fiscalYear,
          reportDate: researchAnnualReports.reportDate,
          downloadUrl: researchAnnualReports.downloadUrl,
          updatedAt: researchAnnualReports.updatedAt,
        })
        .from(researchAnnualReports)
        .where(eq(researchAnnualReports.reportId, report.id))
        .orderBy(desc(researchAnnualReports.fiscalYear)),
      db
        .select({ value: researchValuations, sourceTitle: sources.title })
        .from(researchValuations)
        .leftJoin(sources, eq(sources.id, researchValuations.sourceId))
        .where(eq(researchValuations.reportId, report.id))
        .orderBy(asc(researchValuations.sortOrder)),
      db
        .select()
        .from(researchObservations)
        .where(eq(researchObservations.reportId, report.id))
        .orderBy(asc(researchObservations.sortOrder)),
      db
        .select()
        .from(researchClaims)
        .where(eq(researchClaims.reportId, report.id))
        .orderBy(asc(researchClaims.sortOrder)),
      db
        .select({ value: researchVersions, createdByName: users.displayName })
        .from(researchVersions)
        .leftJoin(users, eq(users.id, researchVersions.createdBy))
        .where(eq(researchVersions.reportId, report.id))
        .orderBy(desc(researchVersions.versionNo)),
      db
        .select({
          id: intelligenceItems.id,
          title: intelligenceItems.title,
          summary: intelligenceItems.summary,
          eventType: intelligenceItems.eventType,
          categoryName: industries.name,
          publishedAt: intelligenceItems.publishedAt,
          originalUrl: intelligenceItems.originalUrl,
        })
        .from(intelligenceItemCompanies)
        .innerJoin(
          intelligenceItems,
          eq(intelligenceItems.id, intelligenceItemCompanies.intelligenceItemId),
        )
        .leftJoin(industries, eq(industries.id, intelligenceItems.industryId))
        .where(
          and(
            eq(intelligenceItemCompanies.companyId, companyId),
            eq(intelligenceItems.organizationId, user.organizationId),
            ...(user.role === "VIEWER"
              ? [eq(intelligenceItems.status, "APPROVED")]
              : []),
            isNull(intelligenceItems.deletedAt),
          ),
        )
        .orderBy(desc(intelligenceItems.publishedAt))
        .limit(5),
    ]);
  const claimIds = claimRows.map((claim) => claim.id);
  const claimSourceRows = claimIds.length
    ? await db
        .select({
          claimId: researchClaimSources.claimId,
          title: sources.title,
          url: sources.url,
          sourceDate: researchClaimSources.sourceDate,
          dataPeriod: researchClaimSources.dataPeriod,
          sourceQuote: researchClaimSources.sourceQuote,
          isVerified: researchClaimSources.isVerified,
        })
        .from(researchClaimSources)
        .innerJoin(sources, eq(sources.id, researchClaimSources.sourceId))
        .where(inArray(researchClaimSources.claimId, claimIds))
    : [];
  const sourcesByClaim = new Map<string, typeof claimSourceRows>();
  for (const source of claimSourceRows) {
    const values = sourcesByClaim.get(source.claimId) ?? [];
    values.push(source);
    sourcesByClaim.set(source.claimId, values);
  }

  return {
    ...base,
    report: {
      id: report.id,
      status: asStatus(report.status),
      currentVersionNo: report.currentVersionNo,
      conclusion: report.conclusion,
      conclusionDate: iso(report.conclusionDate),
      conclusionSummary: report.conclusionSummary,
      coreTension: report.coreTension,
      confidence: report.confidence,
      competenceAssessment: report.competenceAssessment,
      predictability3Year: report.predictability3Year,
      predictability5Year: report.predictability5Year,
      predictability10Year: report.predictability10Year,
      valuationStatus: report.valuationStatus,
      tags: report.tagsJson,
      researchCompleteness: report.researchCompleteness,
      lastChangeSummary: report.lastChangeSummary,
      needsManualCleanup: report.needsManualCleanup,
      ownerName: owner[0]?.displayName ?? null,
      reviewerName: reviewer[0]?.displayName ?? null,
      updatedAt: report.updatedAt.toISOString(),
      industryModuleId: report.industryModuleId,
    },
    sections: sectionRows.map((section) => ({
      id: section.id,
      code: section.code,
      title: section.title,
      content: section.content,
      claimKind: asClaimKind(section.claimKind),
      dataAsOf: iso(section.dataAsOf),
      needsManualCleanup: section.needsManualCleanup,
      updatedAt: section.updatedAt.toISOString(),
    })),
    assumptions: assumptionRows.map(({ value, ownerName }) => ({
      id: value.id,
      title: value.title,
      status: value.status,
      supportEvidence: value.supportEvidence,
      counterEvidence: value.counterEvidence,
      verificationMetric: value.verificationMetric,
      invalidationCondition: value.invalidationCondition,
      nextReviewAt: dateValue(value.nextReviewAt),
      ownerName: ownerName ?? null,
      confidence: value.confidence,
      claimKind: asClaimKind(value.claimKind),
      updatedAt: value.updatedAt.toISOString(),
    })),
    moats: moatRows.map((moat) => ({
      id: moat.id,
      moatType: moat.moatType,
      strength: moat.strength,
      trend: moat.trend,
      evidence: moat.evidence,
      counterEvidence: moat.counterEvidence,
      sustainability: moat.sustainability,
      failureCondition: moat.failureCondition,
      claimKind: asClaimKind(moat.claimKind),
    })),
    metrics: metricRows.map(({ value, sourceTitle }) => ({
      id: value.id,
      code: value.code,
      label: value.label,
      category: value.category,
      value: numberValue(value.valueNumeric),
      unit: value.unit,
      valueType: value.valueType,
      frequency: value.frequency,
      periodEnd: dateValue(value.periodEnd),
      isNormalized: value.isNormalized,
      anomalyNote: value.anomalyNote,
      explanation: value.explanation,
      claimKind: asClaimKind(value.claimKind),
      sourceTitle: sourceTitle ?? null,
    })),
    annualReports: annualReportRows.map((annualReport) => ({
      id: annualReport.id,
      fiscalYear: annualReport.fiscalYear,
      reportDate: dateValue(annualReport.reportDate),
      downloadUrl: annualReport.downloadUrl,
      updatedAt: annualReport.updatedAt.toISOString(),
    })),
    valuations: valuationRows.map(({ value, sourceTitle }) => ({
      id: value.id,
      method: value.method,
      scenario: value.scenario,
      status: value.status,
      currency: value.currency,
      price: numberValue(value.priceNumeric),
      priceAsOf: dateValue(value.priceAsOf),
      marketCap: numberValue(value.marketCapNumeric),
      intrinsicValueLow: numberValue(value.intrinsicValueLow),
      intrinsicValueHigh: numberValue(value.intrinsicValueHigh),
      impliedMarketExpectation: value.impliedMarketExpectation,
      sensitivityNote: value.sensitivityNote,
      claimKind: asClaimKind(value.claimKind),
      sourceTitle: sourceTitle ?? null,
    })),
    observations: observationRows.map((observation) => ({
      id: observation.id,
      observationType: observation.observationType,
      title: observation.title,
      content: observation.content,
      status: observation.status,
      probability: observation.probability,
      impact: observation.impact,
      timeWindow: observation.timeWindow,
      monitorMetric: observation.monitorMetric,
      triggerCondition: observation.triggerCondition,
      claimKind: asClaimKind(observation.claimKind),
    })),
    claims: claimRows.map((claim) => ({
      id: claim.id,
      title: claim.title,
      content: claim.content,
      claimKind: asClaimKind(claim.claimKind),
      isVerified: claim.isVerified,
      dataPeriod: claim.dataPeriod,
      dataAsOf: iso(claim.dataAsOf),
      sources: (sourcesByClaim.get(claim.id) ?? []).map((source) => ({
        title: source.title,
        url: source.url,
        sourceDate: iso(source.sourceDate),
        dataPeriod: source.dataPeriod,
        sourceQuote: source.sourceQuote,
        isVerified: source.isVerified,
      })),
    })),
    versions: versionRows.map(({ value, createdByName }) => ({
      id: value.id,
      versionNo: value.versionNo,
      changeSummary: value.changeSummary,
      status: asStatus(value.status),
      createdByName: createdByName ?? null,
      createdAt: value.createdAt.toISOString(),
    })),
    intelligence: intelligenceRows.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      eventType: item.eventType,
      categoryName: item.categoryName,
      publishedAt: iso(item.publishedAt),
      originalUrl: item.originalUrl,
    })),
  };
}

export async function createCompanyResearch(
  user: AuthUser,
  input: CreateResearchReportInput,
): Promise<CompanyResearchDetail> {
  if (!hasDatabase()) throw new Error("A database connection is required.");
  const company = await ensureCompany(user, input.companyId);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: researchReports.id })
      .from(researchReports)
      .where(
        and(
          eq(researchReports.organizationId, user.organizationId),
          eq(researchReports.companyId, company.id),
          isNull(researchReports.deletedAt),
        ),
      )
      .limit(1);
    if (existing) return;
    const [report] = await tx
      .insert(researchReports)
      .values({
        organizationId: user.organizationId,
        companyId: company.id,
        industryModuleId: input.industryModuleId ?? null,
        ownerUserId: user.id,
        conclusionDate: new Date(),
        status: "DRAFT",
      })
      .returning();
    const sections = researchSectionDefinitions.map((section, sortOrder) => ({
      reportId: report.id,
      code: section.code,
      title: section.title,
      sortOrder,
    }));
    await tx.insert(researchSections).values(sections);
    await tx.insert(researchVersions).values({
      reportId: report.id,
      versionNo: 1,
      snapshotJson: { report, sections },
      changeSummary: "创建研究档案",
      status: "DRAFT",
      createdBy: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "COMPANY_RESEARCH",
      resourceId: report.id,
      requestId: crypto.randomUUID(),
      afterJson: report,
      metadataJson: { title: company.name },
    });
  });
  const detail = await getCompanyResearch(user, input.companyId);
  if (!detail) throw new Error("Created research report not found.");
  return detail;
}

export async function updateCompanyResearch(
  user: AuthUser,
  companyId: string,
  input: UpdateResearchReportInput,
): Promise<CompanyResearchDetail> {
  if (!hasDatabase()) throw new Error("A database connection is required.");
  const company = await ensureCompany(user, companyId);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(researchReports)
      .where(
        and(
          eq(researchReports.companyId, companyId),
          eq(researchReports.organizationId, user.organizationId),
          isNull(researchReports.deletedAt),
        ),
      )
      .limit(1);
    if (!current) throw new Error("Research report not found.");
    if (current.status !== "DRAFT") {
      throw new Error("Only draft research reports can be edited.");
    }
    if (input.industryModuleId) {
      const [module] = await tx
        .select({ id: researchIndustryModules.id })
        .from(researchIndustryModules)
        .where(
          and(
            eq(researchIndustryModules.id, input.industryModuleId),
            eq(researchIndustryModules.isActive, true),
          ),
        )
        .limit(1);
      if (!module) throw new Error("Industry module not found.");
    }
    await tx
      .update(researchReports)
      .set({
        conclusion: input.conclusion ?? current.conclusion,
        conclusionDate:
          input.conclusionDate === undefined
            ? current.conclusionDate
            : input.conclusionDate
              ? new Date(input.conclusionDate)
              : null,
        conclusionSummary:
          input.conclusionSummary === undefined
            ? current.conclusionSummary
            : input.conclusionSummary,
        coreTension:
          input.coreTension === undefined ? current.coreTension : input.coreTension,
        confidence: input.confidence === undefined ? current.confidence : input.confidence,
        competenceAssessment:
          input.competenceAssessment === undefined
            ? current.competenceAssessment
            : input.competenceAssessment,
        predictability3Year:
          input.predictability3Year === undefined
            ? current.predictability3Year
            : input.predictability3Year,
        predictability5Year:
          input.predictability5Year === undefined
            ? current.predictability5Year
            : input.predictability5Year,
        predictability10Year:
          input.predictability10Year === undefined
            ? current.predictability10Year
            : input.predictability10Year,
        valuationStatus:
          input.valuationStatus === undefined
            ? current.valuationStatus
            : input.valuationStatus ?? "PENDING",
        industryModuleId:
          input.industryModuleId === undefined
            ? current.industryModuleId
            : input.industryModuleId,
        updatedAt: new Date(),
      })
      .where(eq(researchReports.id, current.id));
    for (const section of input.sections ?? []) {
      const definition = researchSectionDefinitions.find(
        (candidate) => candidate.code === section.code,
      );
      if (!definition) continue;
      await tx
        .insert(researchSections)
        .values({
          reportId: current.id,
          code: definition.code,
          title: definition.title,
          content: section.content ?? null,
          claimKind: section.claimKind,
          needsManualCleanup: false,
          sortOrder: researchSectionDefinitions.findIndex(
            (candidate) => candidate.code === definition.code,
          ),
        })
        .onConflictDoUpdate({
          target: [researchSections.reportId, researchSections.code],
          set: {
            content: section.content ?? null,
            claimKind: section.claimKind,
            needsManualCleanup: false,
            updatedAt: new Date(),
          },
        });
    }
    for (const assumption of input.assumptions ?? []) {
      if (assumption.id) {
        const [existing] = await tx
          .select({ id: researchAssumptions.id })
          .from(researchAssumptions)
          .where(
            and(
              eq(researchAssumptions.id, assumption.id),
              eq(researchAssumptions.reportId, current.id),
            ),
          )
          .limit(1);
        if (!existing) throw new Error("Research assumption not found.");
        await tx
          .update(researchAssumptions)
          .set({
            title: assumption.title,
            status: assumption.status,
            supportEvidence: assumption.supportEvidence ?? null,
            counterEvidence: assumption.counterEvidence ?? null,
            verificationMetric: assumption.verificationMetric ?? null,
            invalidationCondition: assumption.invalidationCondition ?? null,
            nextReviewAt: assumption.nextReviewAt ?? null,
            confidence: assumption.confidence ?? null,
            claimKind: assumption.claimKind,
            updatedAt: new Date(),
          })
          .where(eq(researchAssumptions.id, assumption.id));
      } else {
        await tx.insert(researchAssumptions).values({
          reportId: current.id,
          title: assumption.title,
          status: assumption.status,
          supportEvidence: assumption.supportEvidence ?? null,
          counterEvidence: assumption.counterEvidence ?? null,
          verificationMetric: assumption.verificationMetric ?? null,
          invalidationCondition: assumption.invalidationCondition ?? null,
          nextReviewAt: assumption.nextReviewAt ?? null,
          ownerUserId: user.id,
          confidence: assumption.confidence ?? null,
          claimKind: assumption.claimKind,
          sortOrder: (input.assumptions ?? []).indexOf(assumption),
        });
      }
    }
    const [sections, assumptions] = await Promise.all([
      tx
        .select()
        .from(researchSections)
        .where(eq(researchSections.reportId, current.id))
        .orderBy(asc(researchSections.sortOrder)),
      tx
        .select()
        .from(researchAssumptions)
        .where(eq(researchAssumptions.reportId, current.id))
        .orderBy(asc(researchAssumptions.sortOrder)),
    ]);
    const [next] = await tx
      .update(researchReports)
      .set({
        currentVersionNo: current.currentVersionNo + 1,
        researchCompleteness: calculateCompleteness(sections, assumptions),
        lastChangeSummary: input.changeSummary,
        updatedAt: new Date(),
      })
      .where(eq(researchReports.id, current.id))
      .returning();
    await tx.insert(researchVersions).values({
      reportId: current.id,
      versionNo: next.currentVersionNo,
      snapshotJson: { report: next, sections, assumptions },
      changeSummary: input.changeSummary,
      status: next.status,
      createdBy: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "UPDATE",
      resourceType: "COMPANY_RESEARCH",
      resourceId: current.id,
      requestId: crypto.randomUUID(),
      beforeJson: current,
      afterJson: next,
      metadataJson: { title: company.name, changeSummary: input.changeSummary },
    });
  });
  const detail = await getCompanyResearch(user, companyId);
  if (!detail) throw new Error("Updated research report not found.");
  return detail;
}

export async function transitionCompanyResearch(
  user: AuthUser,
  companyId: string,
  input: ResearchTransitionInput,
): Promise<CompanyResearchDetail> {
  if (!hasDatabase()) throw new Error("A database connection is required.");
  const company = await ensureCompany(user, companyId);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(researchReports)
      .where(
        and(
          eq(researchReports.companyId, companyId),
          eq(researchReports.organizationId, user.organizationId),
          isNull(researchReports.deletedAt),
        ),
      )
      .limit(1);
    if (!current) throw new Error("Research report not found.");
    const nextStatus =
      input.action === "SUBMIT"
        ? "PENDING_REVIEW"
        : input.action === "APPROVE"
          ? "APPROVED"
          : "DRAFT";
    const valid =
      (input.action === "SUBMIT" && current.status === "DRAFT") ||
      (input.action === "APPROVE" && current.status === "PENDING_REVIEW") ||
      (input.action === "RETURN_TO_DRAFT" && current.status === "PENDING_REVIEW");
    if (!valid) throw new Error("Invalid research report status transition.");
    const [next] = await tx
      .update(researchReports)
      .set({
        status: nextStatus,
        reviewerUserId: input.action === "APPROVE" ? user.id : null,
        reviewedAt: input.action === "APPROVE" ? new Date() : null,
        currentVersionNo: current.currentVersionNo + 1,
        lastChangeSummary:
          input.comment ??
          (input.action === "SUBMIT"
            ? "提交审核"
            : input.action === "APPROVE"
              ? "审核通过"
              : "退回草稿"),
        updatedAt: new Date(),
      })
      .where(eq(researchReports.id, current.id))
      .returning();
    const [sections, assumptions] = await Promise.all([
      tx.select().from(researchSections).where(eq(researchSections.reportId, current.id)),
      tx.select().from(researchAssumptions).where(eq(researchAssumptions.reportId, current.id)),
    ]);
    const [version] = await tx
      .insert(researchVersions)
      .values({
        reportId: current.id,
        versionNo: next.currentVersionNo,
        snapshotJson: { report: next, sections, assumptions },
        changeSummary: next.lastChangeSummary ?? "状态变更",
        status: next.status,
        createdBy: user.id,
      })
      .returning();
    await tx.insert(researchReviews).values({
      reportId: current.id,
      versionId: version.id,
      action: input.action,
      comment: input.comment ?? null,
      actorUserId: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: input.action,
      resourceType: "COMPANY_RESEARCH",
      resourceId: current.id,
      requestId: crypto.randomUUID(),
      beforeJson: current,
      afterJson: next,
      metadataJson: { title: company.name, comment: input.comment ?? null },
    });
  });
  const detail = await getCompanyResearch(user, companyId);
  if (!detail) throw new Error("Updated research report not found.");
  return detail;
}
