import { and, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "../db/client";
import {
  auditLogs,
  companies,
  researchClaimSources,
  researchClaims,
  researchReports,
  researchSections,
  researchVersions,
  sources,
} from "../db/schema";
import { companyProfileSeeds } from "../lib/company-research/company-profile-catalog";
import { researchSectionDefinitions } from "../lib/company-research/types";

const organizationId = process.argv[2];

function sectionTitle(code: "overview" | "business_model") {
  return researchSectionDefinitions.find((section) => section.code === code)?.title ?? code;
}

async function main() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is required.");
  if (!organizationId) {
    throw new Error("Usage: npm run db:import-company-profiles -- <organizationId>");
  }
  const db = getDb();
  let imported = 0;
  const skipped: string[] = [];
  for (const profile of companyProfileSeeds) {
    const [row] = await db
      .select({ company: companies, report: researchReports })
      .from(companies)
      .innerJoin(researchReports, eq(researchReports.companyId, companies.id))
      .where(
        and(
          eq(companies.organizationId, organizationId),
          eq(companies.name, profile.companyName),
          isNull(researchReports.deletedAt),
        ),
      )
      .limit(1);
    if (!row) {
      skipped.push(profile.companyName);
      continue;
    }
    await db.transaction(async (tx) => {
      const sourceTitle = `${profile.publisher}｜${profile.companyName}｜公司画像`;
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
              sourceType: "COMPANY_WEBSITE",
              title: sourceTitle,
              publisher: profile.publisher,
              url: profile.url,
              accessedAt: new Date(),
            })
            .returning())[0];
      const existingSections = await tx
        .select({ code: researchSections.code, content: researchSections.content })
        .from(researchSections)
        .where(eq(researchSections.reportId, row.report.id));
      const missingOverview = !existingSections.find((section) => section.code === "overview")?.content?.trim();
      const missingBusinessModel = !existingSections.find((section) => section.code === "business_model")?.content?.trim();
      if (!missingOverview && !missingBusinessModel) {
        skipped.push(profile.companyName);
        return;
      }
      const sections = [
        { code: "overview" as const, content: profile.overview, missing: missingOverview },
        { code: "business_model" as const, content: profile.businessModel, missing: missingBusinessModel },
      ];
      for (const section of sections.filter((item) => item.missing)) {
        await tx.insert(researchSections).values({
          reportId: row.report.id,
          code: section.code,
          title: sectionTitle(section.code),
          content: section.content,
          claimKind: "FACT",
          sourceId: source.id,
          dataAsOf: new Date(),
          sortOrder: researchSectionDefinitions.findIndex((item) => item.code === section.code),
        });
      }
      const claimTitle = `公司画像｜${profile.companyName}`;
      const [existingClaim] = await tx
        .select({ id: researchClaims.id })
        .from(researchClaims)
        .where(and(eq(researchClaims.reportId, row.report.id), eq(researchClaims.title, claimTitle)))
        .limit(1);
      if (!existingClaim) {
        const [claim] = await tx
          .insert(researchClaims)
          .values({
            reportId: row.report.id,
            title: claimTitle,
            content: `${profile.overview}\n\n${profile.businessModel}`,
            claimKind: "FACT",
            isVerified: true,
            sortOrder: 0,
          })
          .returning();
        await tx.insert(researchClaimSources).values({
          claimId: claim.id,
          sourceId: source.id,
          sourceDate: new Date(),
          sourceQuote: profile.overview,
          isVerified: true,
        });
      }
      const [next] = await tx
        .update(researchReports)
        .set({
          currentVersionNo: row.report.currentVersionNo + 1,
          conclusionSummary: row.report.conclusionSummary ?? profile.overview,
          researchCompleteness: Math.max(row.report.researchCompleteness, 14),
          lastChangeSummary: "补充公司画像与商业模式（官网事实）",
          updatedAt: new Date(),
        })
        .where(eq(researchReports.id, row.report.id))
        .returning();
      await tx.insert(researchVersions).values({
        reportId: row.report.id,
        versionNo: next.currentVersionNo,
        snapshotJson: { source: profile.url, sections: sections.filter((item) => item.missing) },
        changeSummary: "补充公司画像与商业模式（官网事实）",
        status: next.status,
        createdBy: row.report.ownerUserId ?? undefined,
      });
      await tx.insert(auditLogs).values({
        organizationId,
        actorUserId: row.report.ownerUserId,
        action: "IMPORT",
        resourceType: "COMPANY_RESEARCH_PROFILE",
        resourceId: row.report.id,
        requestId: crypto.randomUUID(),
        afterJson: { company: profile.companyName, source: profile.url, sections: sections.filter((item) => item.missing).map((item) => item.code) },
      });
      imported += 1;
    });
  }
  console.log(JSON.stringify({ imported, skipped }, null, 2));
}

await main();
