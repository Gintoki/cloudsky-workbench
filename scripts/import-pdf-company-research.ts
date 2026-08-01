import { readFile } from "node:fs/promises";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "../db/client";
import {
  auditLogs,
  companies,
  researchClaimSources,
  researchClaims,
  researchIndustryModules,
  researchReports,
  researchSections,
  researchVersions,
  securities,
  sources,
  users,
} from "../db/schema";
import { pdfResearchCompanies } from "../lib/company-research/pdf-company-catalog";
import { researchSectionDefinitions, type ResearchClaimKind } from "../lib/company-research/types";

type PdfExcerpt = {
  name: string;
  pageStart: number;
  pageEnd: number;
  sourceDate: string | null;
  conclusion: string;
  businessModel: string;
  assumptions: string;
  financial: string;
  valuation: string;
  risks: string;
};

const organizationId = process.argv[2];
const actorUserId = process.argv[3];
const sourcePath = new URL(
  "../data/company-research/investment-methodology-excerpts.json",
  import.meta.url,
);

const sectionImports: Array<{
  code: string;
  field: keyof Pick<PdfExcerpt, "conclusion" | "businessModel" | "assumptions" | "financial" | "valuation" | "risks">;
  claimKind: ResearchClaimKind;
}> = [
  { code: "overview", field: "conclusion", claimKind: "OPINION" },
  { code: "business_model", field: "businessModel", claimKind: "FACT" },
  { code: "assumptions", field: "assumptions", claimKind: "INFERENCE" },
  { code: "financial_quality", field: "financial", claimKind: "FACT" },
  { code: "valuation", field: "valuation", claimKind: "ESTIMATE" },
  { code: "catalysts_risks", field: "risks", claimKind: "INFERENCE" },
];

function dateAtMidnight(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function importedText(excerpt: PdfExcerpt, value: string) {
  return [
    `历史资料。来源：《投资方法框架》（用户提供），第 ${excerpt.pageStart}-${excerpt.pageEnd} 页。`,
    `来源日期：${excerpt.sourceDate ?? "未标注"}；尚未按当前时点重新核验。`,
    "",
    value,
  ].join("\n");
}

function defaultTags(industry: string | null) {
  if (industry === "边缘云") return ["技术成长", "云基础设施"];
  if (industry === "基础设施") return ["技术成长", "基础设施"];
  if (industry === "端侧设备") return ["技术成长", "终端硬件"];
  return ["待补充"];
}

async function main() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is required.");
  if (!organizationId || !actorUserId) {
    throw new Error("Usage: npm run db:import-pdf-research -- <organizationId> <actorUserId>");
  }

  const db = getDb();
  const excerpts = JSON.parse(await readFile(sourcePath, "utf8")) as PdfExcerpt[];
  const excerptByName = new Map(excerpts.map((item) => [item.name, item]));
  const modules = await db
    .select({ id: researchIndustryModules.id, code: researchIndustryModules.code })
    .from(researchIndustryModules);
  const moduleIdByCode = new Map(modules.map((item) => [item.code, item.id]));
  const [actor] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, actorUserId), eq(users.organizationId, organizationId)))
    .limit(1);
  if (!actor) throw new Error("The actor must be an active user in the target organization.");

  let importedCompanies = 0;
  let createdReports = 0;
  let createdClaims = 0;

  for (const catalog of pdfResearchCompanies) {
    const excerpt = excerptByName.get(catalog.name);
    if (!excerpt) throw new Error(`Missing PDF excerpt for ${catalog.name}.`);
    await db.transaction(async (tx) => {
      const [existingCompany] = await tx
        .select()
        .from(companies)
        .where(and(eq(companies.organizationId, organizationId), eq(companies.name, catalog.name)))
        .limit(1);
      const company = existingCompany
        ? existingCompany
        : (await tx
            .insert(companies)
            .values({
              organizationId,
              name: catalog.name,
              country: catalog.country,
              industry: catalog.industry,
              entityType: "COMPANY",
              notionPageUrl: catalog.notionPageUrl,
              ownerUserId: actorUserId,
            })
            .returning())[0];
      if (!existingCompany) importedCompanies += 1;
      if (existingCompany && !existingCompany.notionPageUrl) {
        await tx
          .update(companies)
          .set({ notionPageUrl: catalog.notionPageUrl })
          .where(eq(companies.id, company.id));
      }

      if (catalog.ticker && catalog.exchange && catalog.currency) {
        const [security] = await tx
          .select({ id: securities.id })
          .from(securities)
          .where(and(eq(securities.companyId, company.id), eq(securities.ticker, catalog.ticker)))
          .limit(1);
        if (!security) {
          await tx.insert(securities).values({
            companyId: company.id,
            ticker: catalog.ticker,
            exchange: catalog.exchange,
            currency: catalog.currency,
            isPrimary: true,
          });
        }
      }

      const sourceTitle = `投资方法框架（用户提供）｜${catalog.name}｜第${excerpt.pageStart}-${excerpt.pageEnd}页`;
      const [existingSource] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(and(eq(sources.organizationId, organizationId), eq(sources.title, sourceTitle)))
        .limit(1);
      const source = existingSource
        ? existingSource
        : (await tx
            .insert(sources)
            .values({
              organizationId,
              sourceType: "USER_DOCUMENT",
              title: sourceTitle,
              publisher: "用户提供",
              publishedAt: dateAtMidnight(excerpt.sourceDate),
              accessedAt: new Date(),
            })
            .returning())[0];

      const [existingReport] = await tx
        .select()
        .from(researchReports)
        .where(
          and(
            eq(researchReports.organizationId, organizationId),
            eq(researchReports.companyId, company.id),
            isNull(researchReports.deletedAt),
          ),
        )
        .limit(1);
      const report = existingReport
        ? existingReport
        : (await tx
            .insert(researchReports)
            .values({
              organizationId,
              companyId: company.id,
              industryModuleId: catalog.moduleCode ? moduleIdByCode.get(catalog.moduleCode) ?? null : null,
              status: "DRAFT",
              conclusion: catalog.conclusion,
              conclusionDate: dateAtMidnight(excerpt.sourceDate),
              conclusionSummary: "已导入用户提供 PDF 的历史研究结论，需结合当前信息复核。",
              coreTension: "历史资料已入库；当前经营、价格与估值须单独更新后再作判断。",
              valuationStatus: "HISTORICAL_SOURCE_IMPORTED",
              tagsJson: catalog.tags,
              ownerUserId: actorUserId,
              lastChangeSummary: "导入《投资方法框架》历史研究资料",
            })
            .returning())[0];
      if (!existingReport) createdReports += 1;
      if (existingReport) {
        const tags = [...new Set([...(existingReport.tagsJson ?? []), ...catalog.tags])];
        await tx
          .update(researchReports)
          .set({ tagsJson: tags, updatedAt: new Date() })
          .where(eq(researchReports.id, report.id));
      }

      let addedContent = false;
      for (const item of sectionImports) {
        const definition = researchSectionDefinitions.find((section) => section.code === item.code);
        if (!definition) continue;
        const [existingSection] = await tx
          .select({ id: researchSections.id, content: researchSections.content })
          .from(researchSections)
          .where(and(eq(researchSections.reportId, report.id), eq(researchSections.code, item.code)))
          .limit(1);
        if (!existingSection || !existingSection.content?.trim()) {
          const values = {
            reportId: report.id,
            code: item.code,
            title: definition.title,
            content: importedText(excerpt, excerpt[item.field]),
            claimKind: item.claimKind,
            sourceId: source.id,
            dataAsOf: dateAtMidnight(excerpt.sourceDate),
            sortOrder: researchSectionDefinitions.findIndex((section) => section.code === item.code),
          };
          if (existingSection) {
            await tx.update(researchSections).set(values).where(eq(researchSections.id, existingSection.id));
          } else {
            await tx.insert(researchSections).values(values);
          }
          addedContent = true;
        }
      }

      for (const item of sectionImports.filter((section) => ["overview", "financial_quality", "valuation", "catalysts_risks"].includes(section.code))) {
        const title = `PDF历史研究摘录｜${catalog.name}｜${item.code}`;
        const [existingClaim] = await tx
          .select({ id: researchClaims.id })
          .from(researchClaims)
          .where(and(eq(researchClaims.reportId, report.id), eq(researchClaims.title, title)))
          .limit(1);
        if (existingClaim) continue;
        const [claim] = await tx
          .insert(researchClaims)
          .values({
            reportId: report.id,
            title,
            content: importedText(excerpt, excerpt[item.field]),
            claimKind: item.claimKind,
            isVerified: false,
            dataPeriod: excerpt.sourceDate ? excerpt.sourceDate.slice(0, 7) : null,
            dataAsOf: dateAtMidnight(excerpt.sourceDate),
            sortOrder: createdClaims,
          })
          .returning();
        await tx.insert(researchClaimSources).values({
          claimId: claim.id,
          sourceId: source.id,
          sourceDate: dateAtMidnight(excerpt.sourceDate),
          dataPeriod: excerpt.sourceDate ? excerpt.sourceDate.slice(0, 7) : null,
          sourceQuote: excerpt[item.field].slice(0, 700),
          isVerified: false,
        });
        createdClaims += 1;
      }

      if (!existingReport && addedContent) {
        await tx.insert(researchVersions).values({
          reportId: report.id,
          versionNo: 1,
          snapshotJson: { importedFrom: sourceTitle, pageStart: excerpt.pageStart, pageEnd: excerpt.pageEnd },
          changeSummary: "导入《投资方法框架》历史研究资料",
          status: "DRAFT",
          createdBy: actorUserId,
        });
        await tx.insert(auditLogs).values({
          organizationId,
          actorUserId,
          action: "IMPORT",
          resourceType: "COMPANY_RESEARCH",
          resourceId: report.id,
          requestId: crypto.randomUUID(),
          afterJson: { sourceTitle, tags: catalog.tags },
          metadataJson: { company: catalog.name, pageStart: excerpt.pageStart, pageEnd: excerpt.pageEnd },
        });
      }
    });
  }

  const existingCompanies = await db
    .select()
    .from(companies)
    .where(and(eq(companies.organizationId, organizationId), eq(companies.entityType, "COMPANY")));
  const catalogNames = new Set(pdfResearchCompanies.map((item) => item.name));
  for (const company of existingCompanies.filter((item) => !catalogNames.has(item.name))) {
    const tags = defaultTags(company.industry);
    const [report] = await db
      .select()
      .from(researchReports)
      .where(
        and(
          eq(researchReports.organizationId, organizationId),
          eq(researchReports.companyId, company.id),
          isNull(researchReports.deletedAt),
        ),
      )
      .limit(1);
    if (!report) {
      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(researchReports)
          .values({
            organizationId,
            companyId: company.id,
            status: "DRAFT",
            conclusion: "INSUFFICIENT_INFORMATION",
            conclusionDate: new Date(),
            valuationStatus: "PENDING",
            tagsJson: tags,
            ownerUserId: actorUserId,
            lastChangeSummary: "建立待补充研究档案",
          })
          .returning();
        await tx.insert(researchVersions).values({
          reportId: created.id,
          versionNo: 1,
          snapshotJson: { report: created },
          changeSummary: "建立待补充研究档案",
          status: "DRAFT",
          createdBy: actorUserId,
        });
      });
      createdReports += 1;
    } else if (!(report.tagsJson ?? []).length) {
      await db.update(researchReports).set({ tagsJson: tags }).where(eq(researchReports.id, report.id));
    }
  }

  console.log(JSON.stringify({ importedCompanies, createdReports, createdClaims }));
}

await main();
