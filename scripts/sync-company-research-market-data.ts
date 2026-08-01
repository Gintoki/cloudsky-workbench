import { and, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "../db/client";
import {
  researchReports,
  researchValuations,
  securities,
  sources,
  stockPrices,
} from "../db/schema";
import { getComparableMarketData } from "../lib/market-data/comparables";

const organizationId = process.argv[2];

function dateAtMidnight(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is required.");
  if (!organizationId) {
    throw new Error("Usage: npm run db:sync-research-market -- <organizationId>");
  }

  const db = getDb();
  const market = await getComparableMarketData({ forceRefresh: true });
  const priceAsOf = market.items.find(
    (item) => item.price !== null && item.marketCap !== null && item.priceAsOf,
  )?.priceAsOf;
  if (!priceAsOf) {
    throw new Error("No prior-trading-day prices are available from the configured public sources.");
  }

  const sourceTitle = `公开市场行情聚合（腾讯财经/东方财富）｜${priceAsOf}`;
  const [existingSource] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.organizationId, organizationId), eq(sources.title, sourceTitle)))
    .limit(1);
  const source = existingSource
    ? existingSource
    : (await db
        .insert(sources)
        .values({
          organizationId,
          sourceType: "PUBLIC_MARKET_DATA",
          title: sourceTitle,
          publisher: "腾讯财经、东方财富",
          publishedAt: dateAtMidnight(priceAsOf),
          accessedAt: new Date(),
        })
        .returning())[0];

  let priceRows = 0;
  let valuationRows = 0;
  for (const item of market.items) {
    if (item.price === null || item.marketCap === null || !item.priceAsOf) continue;
    const [security] = await db
      .select({ id: securities.id, companyId: securities.companyId })
      .from(securities)
      .where(eq(securities.ticker, item.ticker))
      .limit(1);
    if (!security) continue;
    const [report] = await db
      .select({ id: researchReports.id })
      .from(researchReports)
      .where(
        and(
          eq(researchReports.organizationId, organizationId),
          eq(researchReports.companyId, security.companyId),
          isNull(researchReports.deletedAt),
        ),
      )
      .limit(1);
    if (!report) continue;

    await db
      .insert(stockPrices)
      .values({
        securityId: security.id,
        priceDate: item.priceAsOf,
        close: String(item.price),
        adjustedClose: String(item.price),
        marketCap: String(item.marketCap),
        sourceId: source.id,
      })
      .onConflictDoUpdate({
        target: [stockPrices.securityId, stockPrices.priceDate],
        set: {
          close: String(item.price),
          adjustedClose: String(item.price),
          marketCap: String(item.marketCap),
          sourceId: source.id,
        },
      });
    priceRows += 1;

    const [existingValuation] = await db
      .select({ id: researchValuations.id })
      .from(researchValuations)
      .where(
        and(
          eq(researchValuations.reportId, report.id),
          eq(researchValuations.method, "PUBLIC_MARKET_REFERENCE"),
          eq(researchValuations.priceAsOf, item.priceAsOf),
        ),
      )
      .limit(1);
    const values = {
      sourceId: source.id,
      method: "PUBLIC_MARKET_REFERENCE",
      scenario: "BASE" as const,
      status: "MARKET_REFERENCE",
      currency: item.currency,
      priceNumeric: String(item.price),
      priceAsOf: item.priceAsOf,
      marketCapNumeric: String(item.marketCap),
      inputsJson: {
        collectedAt: market.fetchedAt,
        priceBasis: "PREVIOUS_CLOSE",
        provider: market.provider,
        sources: market.sources,
      },
      impliedMarketExpectation: "市场参考值，不构成内在价值或买卖建议。",
      sensitivityNote: `前一交易日收盘价/市值，采集于 ${new Date().toISOString().slice(0, 10)}。`,
      claimKind: "FACT" as const,
      sortOrder: 0,
    };
    if (existingValuation) {
      await db.update(researchValuations).set(values).where(eq(researchValuations.id, existingValuation.id));
    } else {
      await db.insert(researchValuations).values({ reportId: report.id, ...values });
      valuationRows += 1;
    }
    await db
      .update(researchReports)
      .set({ valuationStatus: "MARKET_REFERENCE_UPDATED", updatedAt: new Date() })
      .where(eq(researchReports.id, report.id));
  }

  console.log(JSON.stringify({ priceAsOf, priceRows, valuationRows, provider: market.provider }));
}

await main();
