import { and, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "../db/client";
import {
  auditLogs,
  companies,
  researchAnnualReports,
  researchReports,
  securities,
  sources,
} from "../db/schema";
import { fetchVerifiedAnnualReports, type VerifiedAnnualReportLink } from "../lib/company-research/annual-report-links";
import { comparableUniverse } from "../lib/market-data/coverage-universe";

const organizationId = process.argv[2];
const companyNames = new Set(process.argv.slice(3));

function marketSecurity(name: string, ticker: string | null) {
  if (ticker) {
    const exact = comparableUniverse.find((security) => security.ticker.toUpperCase() === ticker.toUpperCase());
    if (exact) return exact;
  }
  return comparableUniverse.find(
    (security) => security.name === name || security.researchNames.includes(name),
  ) ?? null;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function isLegacyMetricUrl(url: string) {
  return url.includes("datacenter-web.eastmoney.com/api/data");
}

async function syncReport(report: {
  id: string;
  companyName: string;
  ownerUserId: string | null;
  ticker: string | null;
}) {
  const security = marketSecurity(report.companyName, report.ticker);
  if (!security) return { company: report.companyName, status: "SKIPPED_NO_PUBLIC_MAPPING" };

  let annualReports: VerifiedAnnualReportLink[];
  try {
    annualReports = await fetchVerifiedAnnualReports(security);
  } catch (error) {
    return {
      company: report.companyName,
      status: "FETCH_FAILED",
      message: error instanceof Error ? error.message : "unknown",
    };
  }

  const db = getDb();
  let created = 0;
  let preserved = 0;
  let removedLegacy = 0;
  await db.transaction(async (tx) => {
    const existingRows = await tx
      .select({
        id: researchAnnualReports.id,
        fiscalYear: researchAnnualReports.fiscalYear,
        downloadUrl: researchAnnualReports.downloadUrl,
      })
      .from(researchAnnualReports)
      .where(eq(researchAnnualReports.reportId, report.id));
    const existingByYear = new Map(existingRows.map((item) => [item.fiscalYear, item]));
    for (const existing of existingRows.filter((item) => isLegacyMetricUrl(item.downloadUrl))) {
      await tx.delete(researchAnnualReports).where(eq(researchAnnualReports.id, existing.id));
      existingByYear.delete(existing.fiscalYear);
      removedLegacy += 1;
    }

    for (const annualReport of annualReports) {
      const title = `${annualReport.publisher}｜${security.ticker}｜FY${annualReport.fiscalYear}`;
      const [existingSource] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(and(eq(sources.organizationId, organizationId!), eq(sources.title, title)))
        .limit(1);
      const sourceValues = {
        sourceType: "PUBLIC_FINANCIAL_STATEMENT",
        publisher: annualReport.publisher,
        url: annualReport.downloadUrl,
        publishedAt: annualReport.reportDate ? new Date(`${annualReport.reportDate}T00:00:00.000Z`) : null,
        accessedAt: new Date(),
        updatedAt: new Date(),
      };
      const source = existingSource
        ? (await tx.update(sources).set(sourceValues).where(eq(sources.id, existingSource.id)).returning())[0]
        : (await tx.insert(sources).values({ organizationId: organizationId!, title, ...sourceValues }).returning())[0];
      const existing = existingByYear.get(annualReport.fiscalYear);
      if (existing) {
        preserved += 1;
        continue;
      }
      await tx.insert(researchAnnualReports).values({
        reportId: report.id,
        fiscalYear: annualReport.fiscalYear,
        sourceId: source.id,
        downloadUrl: annualReport.downloadUrl,
        reportDate: annualReport.reportDate,
      });
      created += 1;
    }
    if (created || removedLegacy) {
      await tx.insert(auditLogs).values({
        organizationId: organizationId!,
        actorUserId: report.ownerUserId,
        action: "SYNC",
        resourceType: "COMPANY_RESEARCH_ANNUAL_REPORTS",
        resourceId: report.id,
        requestId: crypto.randomUUID(),
        afterJson: {
          ticker: security.ticker,
          sourceMarket: security.market,
          fiscalYears: annualReports.map((item) => item.fiscalYear),
          created,
          preserved,
          removedLegacy,
        },
      });
    }
  });
  return {
    company: report.companyName,
    ticker: security.ticker,
    sourceMarket: security.market,
    status: annualReports.length ? "SYNCED" : "NO_VERIFIED_ORIGINAL_DOCUMENTS",
    fiscalYears: annualReports.map((item) => item.fiscalYear),
    created,
    preserved,
    removedLegacy,
  };
}

async function main() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is required.");
  if (!organizationId) {
    throw new Error("Usage: npm run db:sync-research-annual-reports -- <organizationId>");
  }
  const db = getDb();
  const reports = await db
    .select({
      id: researchReports.id,
      companyName: companies.name,
      ownerUserId: researchReports.ownerUserId,
      ticker: securities.ticker,
    })
    .from(researchReports)
    .innerJoin(companies, eq(researchReports.companyId, companies.id))
    .leftJoin(securities, and(eq(securities.companyId, companies.id), eq(securities.isPrimary, true)))
    .where(
      and(
        eq(researchReports.organizationId, organizationId),
        eq(companies.entityType, "COMPANY"),
        isNull(researchReports.deletedAt),
      ),
    );
  const scopedReports = companyNames.size
    ? reports.filter((report) => companyNames.has(report.companyName))
    : reports;
  const results = await mapWithConcurrency(scopedReports, 2, syncReport);
  const summary = results.reduce<Record<string, number>>((counts, result) => {
    counts[result.status] = (counts[result.status] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ summary, results }, null, 2));
}

await main();
