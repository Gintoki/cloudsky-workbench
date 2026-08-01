import { and, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "../db/client";
import {
  auditLogs,
  companies,
  researchMetrics,
  researchReports,
  securities,
  sources,
} from "../db/schema";
import { fetchAnnualFinancialHistory } from "../lib/market-data/financial-history";
import { comparableUniverse, type ComparableSecurity } from "../lib/market-data/coverage-universe";

const organizationId = process.argv[2];
const companyNames = new Set(process.argv.slice(3));

const metricDefinitions = [
  { code: "REVENUE", label: "收入", category: "FINANCIAL", field: "revenue" as const, unit: (currency: string) => currency },
  { code: "GROSS_MARGIN", label: "毛利率", category: "FINANCIAL", field: "grossMargin" as const, unit: () => "%" },
  { code: "NET_INCOME", label: "净利润", category: "FINANCIAL", field: "netIncome" as const, unit: (currency: string) => currency },
  { code: "NET_MARGIN", label: "净利率", category: "FINANCIAL", field: "netMargin" as const, unit: () => "%" },
];

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

async function sourceFor(
  organizationId: string,
  security: ComparableSecurity,
  sourceUrl: string,
) {
  const db = getDb();
  const title = `东方财富公开年报聚合｜${security.ticker}`;
  const [existing] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.organizationId, organizationId), eq(sources.title, title)))
    .limit(1);
  if (existing) {
    await db
      .update(sources)
      .set({ url: sourceUrl, accessedAt: new Date(), updatedAt: new Date() })
      .where(eq(sources.id, existing.id));
    return existing;
  }
  return (await db
    .insert(sources)
    .values({
      organizationId,
      sourceType: "PUBLIC_FINANCIAL_STATEMENT",
      title,
      publisher: "东方财富公开财务报表聚合",
      url: sourceUrl,
      accessedAt: new Date(),
    })
    .returning())[0];
}

async function syncReport(
  report: { id: string; companyId: string; companyName: string; ownerUserId: string | null; ticker: string | null },
) {
  const security = marketSecurity(report.companyName, report.ticker);
  if (!security) return { company: report.companyName, status: "SKIPPED_NO_PUBLIC_MAPPING" };
  let history;
  try {
    history = await fetchAnnualFinancialHistory(security);
  } catch (error) {
    return { company: report.companyName, status: "FETCH_FAILED", message: error instanceof Error ? error.message : "unknown" };
  }
  if (!history.length) return { company: report.companyName, status: "NO_ANNUAL_DATA" };

  const db = getDb();
  const source = await sourceFor(organizationId!, security, history[0].sourceUrl);
  let created = 0;
  let updated = 0;
  let preserved = 0;
  await db.transaction(async (tx) => {
    for (const year of history) {
      for (const definition of metricDefinitions) {
        const value = year[definition.field];
        if (value === null) continue;
        const periodEnd = `${year.fiscalYear}-12-31`;
        const [existing] = await tx
          .select()
          .from(researchMetrics)
          .where(
            and(
              eq(researchMetrics.reportId, report.id),
              eq(researchMetrics.code, definition.code),
              eq(researchMetrics.periodEnd, periodEnd),
            ),
          )
          .limit(1);
        const values = {
          sourceId: source.id,
          label: definition.label,
          category: definition.category,
          valueNumeric: String(value),
          unit: definition.unit(year.currency),
          valueType: "ACTUAL" as const,
          frequency: "ANNUAL" as const,
          claimKind: "FACT" as const,
          updatedAt: new Date(),
        };
        if (existing) {
          if (existing.sourceId !== source.id) {
            preserved += 1;
            continue;
          }
          await tx.update(researchMetrics).set(values).where(eq(researchMetrics.id, existing.id));
          updated += 1;
        } else {
          await tx.insert(researchMetrics).values({
            reportId: report.id,
            code: definition.code,
            periodEnd,
            sortOrder: year.fiscalYear,
            ...values,
          });
          created += 1;
        }
      }
    }
    if (created || updated) {
      await tx.insert(auditLogs).values({
        organizationId: organizationId!,
        actorUserId: report.ownerUserId,
        action: "SYNC",
        resourceType: "COMPANY_RESEARCH_FINANCIALS",
        resourceId: report.id,
        requestId: crypto.randomUUID(),
        afterJson: { ticker: security.ticker, years: history.map((item) => item.fiscalYear), created, updated, preserved },
      });
    }
  });
  return { company: report.companyName, ticker: security.ticker, status: "SYNCED", years: history.map((item) => item.fiscalYear), created, updated, preserved };
}

async function main() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is required.");
  if (!organizationId) {
    throw new Error("Usage: npm run db:sync-research-financials -- <organizationId>");
  }
  const db = getDb();
  const reports = await db
    .select({
      id: researchReports.id,
      companyId: companies.id,
      companyName: companies.name,
      ownerUserId: researchReports.ownerUserId,
      ticker: securities.ticker,
    })
    .from(researchReports)
    .innerJoin(companies, eq(researchReports.companyId, companies.id))
    .leftJoin(securities, and(eq(securities.companyId, companies.id), eq(securities.isPrimary, true)))
    .where(and(eq(researchReports.organizationId, organizationId), isNull(researchReports.deletedAt)));
  const scopedReports = companyNames.size
    ? reports.filter((report) => companyNames.has(report.companyName))
    : reports;
  const results = await mapWithConcurrency(scopedReports, 3, syncReport);
  const summary = results.reduce<Record<string, number>>((counts, result) => {
    counts[result.status] = (counts[result.status] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ summary, results }, null, 2));
}

await main();
