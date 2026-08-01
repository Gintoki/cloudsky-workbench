import { comparableUniverse, type ComparableSecurity } from "./coverage-universe";
import type {
  ComparableMarketDataResult,
  ComparableMarketRecord,
} from "@/lib/domain/types";

const TENCENT_QUOTE_URL = "https://qt.gtimg.cn/q=";
const TENCENT_KLINE_URL = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get";
const EASTMONEY_DATA_URL = "https://datacenter-web.eastmoney.com/api/data/v1/get";
const EASTMONEY_SEARCH_URL = "https://searchapi.eastmoney.com/api/suggest/get";
const EASTMONEY_SEARCH_TOKEN = "D43BF722C8E33BDC906FB84D85E326E8";
const DEFAULT_CACHE_HOURS = 24;

type CacheEntry = {
  result: ComparableMarketDataResult;
  expiresAt: number;
};

type TencentQuote = {
  price: number | null;
  previousClose: number | null;
  marketCap: number | null;
};

type DailyPricePoint = {
  date: string;
  close: number;
};

type TencentKlineResponse = {
  data?: Record<string, { qfqday?: unknown[][]; day?: unknown[][] }>;
};

type EastmoneyRecord = Record<string, unknown>;

type FinancialSnapshot = {
  revenue: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  financialPeriod: string | null;
  financialAsOf: string | null;
  financialCurrency: ComparableMarketRecord["financialCurrency"];
};

type EastmoneyDataResponse = {
  success?: boolean;
  result?: { data?: EastmoneyRecord[] | null } | null;
};

type EastmoneySearchResponse = {
  QuotationCodeTable?: {
    Data?: Array<{
      Code?: string;
      Classify?: string;
      MktNum?: string;
    }>;
  };
};

let cache: CacheEntry | null = null;
let inFlight: Promise<ComparableMarketDataResult> | null = null;

function cacheDurationMs() {
  const configured = Number(process.env.PUBLIC_MARKET_DATA_CACHE_HOURS);
  const hours = Number.isFinite(configured)
    ? Math.min(Math.max(configured, 1), 72)
    : DEFAULT_CACHE_HOURS;
  return hours * 60 * 60_000;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || normalized === "--" || normalized === "-") return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toRatio(value: unknown) {
  const number = readNumber(value);
  return number === null ? null : number / 100;
}

function ratio(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

function toCurrency(
  value: unknown,
  fallback: ComparableMarketRecord["financialCurrency"],
) {
  return value === "USD" || value === "CNY" || value === "HKD" ? value : fallback;
}

function priorBusinessDay() {
  const local = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }),
  );
  local.setDate(local.getDate() - 1);
  while (local.getDay() === 0 || local.getDay() === 6) {
    local.setDate(local.getDate() - 1);
  }
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(
    local.getDate(),
  ).padStart(2, "0")}`;
}

function tencentSymbol(security: ComparableSecurity) {
  if (security.market === "US") return `us${security.ticker}`;
  if (security.market === "HK") return `hk${security.ticker.padStart(5, "0")}`;
  if (security.ticker.startsWith("0") || security.ticker.startsWith("3")) {
    return `sz${security.ticker}`;
  }
  if (security.ticker.startsWith("9")) return `bj${security.ticker}`;
  return `sh${security.ticker}`;
}

export function parseTencentQuotes(payload: string) {
  const quotes = new Map<string, TencentQuote>();
  for (const line of payload.split(/\r?\n/)) {
    const keyEnd = line.indexOf("=");
    const quoteStart = line.indexOf('"');
    const quoteEnd = line.lastIndexOf('"');
    if (keyEnd < 0 || quoteStart < 0 || quoteEnd <= quoteStart) continue;

    const key = line.slice(0, keyEnd).replace(/^v_/, "");
    const fields = line.slice(quoteStart + 1, quoteEnd).split("~");
    const price = readNumber(fields[3]);
    const previousClose = readNumber(fields[4]);
    const marketCapInHundredMillions = readNumber(fields[45]);
    const currentMarketCap =
      marketCapInHundredMillions === null
        ? null
        : marketCapInHundredMillions * 100_000_000;
    const marketCap =
      price !== null && price !== 0 && previousClose !== null && currentMarketCap !== null
        ? (currentMarketCap / price) * previousClose
        : currentMarketCap;
    quotes.set(key, { price, previousClose, marketCap });
  }
  return quotes;
}

export function parseTencentKlineHistory(payload: unknown, symbol: string): DailyPricePoint[] {
  const response = payload as TencentKlineResponse;
  const data = response.data?.[symbol];
  const rows = data?.qfqday?.length ? data.qfqday : data?.day ?? [];
  return rows
    .map((row) => ({ date: readString(row[0]), close: readNumber(row[2]) }))
    .filter((row): row is { date: string; close: number } => row.date !== null && row.close !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function percentChange(current: number, baseline: number | undefined) {
  if (!baseline || baseline === 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function lastOnOrBefore(points: DailyPricePoint[], date: string) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].date <= date) return points[index];
  }
  return undefined;
}

function calendarDayGap(earlier: string | undefined, later: string) {
  if (!earlier) return Number.POSITIVE_INFINITY;
  const earlierTime = Date.parse(`${earlier}T00:00:00Z`);
  const laterTime = Date.parse(`${later}T00:00:00Z`);
  if (Number.isNaN(earlierTime) || Number.isNaN(laterTime)) return Number.POSITIVE_INFINITY;
  return Math.round((laterTime - earlierTime) / 86_400_000);
}

export function calculateTencentPricePerformance(history: DailyPricePoint[]) {
  const points = [...history].sort((left, right) => left.date.localeCompare(right.date));
  const latest = points.at(-1);
  if (!latest) {
    return {
      price: null,
      priceAsOf: null,
      priceChangePercent: null,
      thirtyDayChangePercent: null,
      yearToDateChangePercent: null,
    };
  }
  const thirtyDaysEarlier = new Date(`${latest.date}T00:00:00Z`);
  thirtyDaysEarlier.setUTCDate(thirtyDaysEarlier.getUTCDate() - 30);
  const thirtyDayBaseline = lastOnOrBefore(
    points,
    thirtyDaysEarlier.toISOString().slice(0, 10),
  );
  const yearBaseline = lastOnOrBefore(points, `${latest.date.slice(0, 4)}-01-01`);
  const previous = points.at(-2);
  const hasRecentPreviousClose = calendarDayGap(previous?.date, latest.date) <= 10;
  const hasThirtyDayBaseline = calendarDayGap(thirtyDayBaseline?.date, thirtyDaysEarlier.toISOString().slice(0, 10)) <= 10;
  const firstDayOfYear = `${latest.date.slice(0, 4)}-01-01`;
  return {
    price: latest.close,
    priceAsOf: latest.date,
    priceChangePercent: hasRecentPreviousClose ? percentChange(latest.close, previous?.close) : null,
    thirtyDayChangePercent: hasThirtyDayBaseline ? percentChange(latest.close, thirtyDayBaseline?.close) : null,
    yearToDateChangePercent: yearBaseline &&
      yearBaseline.date >= `${Number(latest.date.slice(0, 4)) - 1}-12-15` &&
      yearBaseline.date < firstDayOfYear
      ? percentChange(latest.close, yearBaseline.close)
      : null,
  };
}

async function fetchTencentQuotes() {
  const symbols = comparableUniverse.map(tencentSymbol).join(",");
  const response = await fetch(`${TENCENT_QUOTE_URL}${symbols}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Tencent Finance request failed with status ${response.status}`);
  }
  return parseTencentQuotes(await response.text());
}

async function fetchTencentKlineHistory(security: ComparableSecurity) {
  const symbol = tencentSymbol(security);
  const url = new URL(TENCENT_KLINE_URL);
  url.searchParams.set("param", `${symbol},day,,,400,qfq`);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Tencent Finance kline request failed with status ${response.status}`);
  }
  return parseTencentKlineHistory(await response.json(), symbol);
}

function eastmoneyDataUrl(reportName: string, filter: string) {
  const url = new URL(EASTMONEY_DATA_URL);
  url.searchParams.set("reportName", reportName);
  url.searchParams.set("columns", "ALL");
  url.searchParams.set("filter", filter);
  url.searchParams.set("pageNumber", "1");
  url.searchParams.set("pageSize", "12");
  url.searchParams.set("source", "WEB");
  url.searchParams.set("client", "WEB");
  return url;
}

async function fetchEastmoneyData(reportName: string, filter: string) {
  const response = await fetch(eastmoneyDataUrl(reportName, filter), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Eastmoney request failed with status ${response.status}`);
  }
  const data = (await response.json()) as EastmoneyDataResponse;
  if (!data.success) return [];
  return data.result?.data ?? [];
}

function latestRecord(records: EastmoneyRecord[]) {
  return records.reduce<EastmoneyRecord | null>((latest, record) => {
    if (!latest) return record;
    const latestDate = readString(latest.REPORT_DATE) ?? readString(latest.REPORTDATE) ?? "";
    const recordDate = readString(record.REPORT_DATE) ?? readString(record.REPORTDATE) ?? "";
    return recordDate > latestDate ? record : latest;
  }, null);
}

function financialSnapshotFromChina(record: EastmoneyRecord | null): FinancialSnapshot | null {
  if (!record) return null;
  const revenue = readNumber(record.TOTAL_OPERATE_INCOME);
  const netIncome = readNumber(record.PARENT_NETPROFIT);
  return {
    revenue,
    grossMargin: toRatio(record.XSMLL),
    netMargin: ratio(netIncome, revenue),
    financialPeriod: readString(record.QDATE) ?? readString(record.DATATYPE),
    financialAsOf: readString(record.REPORTDATE)?.slice(0, 10) ?? null,
    financialCurrency: "CNY",
  };
}

function financialSnapshotFromGlobal(
  record: EastmoneyRecord | null,
  fallbackCurrency: ComparableMarketRecord["financialCurrency"],
): FinancialSnapshot | null {
  if (!record) return null;
  return {
    revenue: readNumber(record.OPERATE_INCOME),
    grossMargin: toRatio(record.GROSS_PROFIT_RATIO),
    netMargin: toRatio(record.NET_PROFIT_RATIO),
    financialPeriod: readString(record.REPORT_TYPE) ?? readString(record.REPORT_DATA_TYPE),
    financialAsOf: readString(record.REPORT_DATE)?.slice(0, 10) ?? null,
    financialCurrency: toCurrency(record.CURRENCY_ABBR, fallbackCurrency),
  };
}

async function resolveUsSecuCode(ticker: string) {
  const url = new URL(EASTMONEY_SEARCH_URL);
  url.searchParams.set("input", ticker);
  url.searchParams.set("type", "14");
  url.searchParams.set("token", EASTMONEY_SEARCH_TOKEN);
  url.searchParams.set("count", "10");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as EastmoneySearchResponse;
  const match = data.QuotationCodeTable?.Data?.find(
    (candidate) =>
      candidate.Code?.toUpperCase() === ticker &&
      candidate.Classify === "UsStock" &&
      (candidate.MktNum === "105" || candidate.MktNum === "106" || candidate.MktNum === "107"),
  );
  const suffix =
    match?.MktNum === "105" ? "O" : match?.MktNum === "106" ? "N" : match?.MktNum === "107" ? "A" : null;
  return suffix ? `${ticker}.${suffix}` : null;
}

async function fetchFinancialSnapshot(security: ComparableSecurity) {
  try {
    if (security.market === "CN") {
      const rows = await fetchEastmoneyData(
        "RPT_LICO_FN_CPD",
        `(SECURITY_CODE="${security.ticker}")`,
      );
      return financialSnapshotFromChina(latestRecord(rows));
    }

    const secuCode =
      security.market === "HK"
        ? `${security.ticker.padStart(5, "0")}.HK`
        : await resolveUsSecuCode(security.ticker);
    if (!secuCode) return null;
    const reportName =
      security.market === "HK"
        ? "RPT_HKF10_FN_GMAININDICATOR"
        : "RPT_USF10_FN_GMAININDICATOR";
    const rows = await fetchEastmoneyData(reportName, `(SECUCODE="${secuCode}")`);
    return financialSnapshotFromGlobal(
      latestRecord(rows),
      security.market === "HK" ? "HKD" : "USD",
    );
  } catch {
    return null;
  }
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

function makeEmptyItems(): ComparableMarketRecord[] {
  return comparableUniverse.map((security) => ({
    ticker: security.ticker,
    name: security.name,
    market: security.market,
    currency: security.currency,
    financialCurrency: security.currency,
    price: null,
    priceChangePercent: null,
    thirtyDayChangePercent: null,
    yearToDateChangePercent: null,
    marketCap: null,
    revenue: null,
    grossMargin: null,
    netMargin: null,
    priceAsOf: null,
    financialPeriod: null,
    financialAsOf: null,
    dataStatus: "UNAVAILABLE",
  }));
}

async function loadComparableMarketData(): Promise<ComparableMarketDataResult> {
  const fetchedAt = new Date();
  const cacheExpiresAt = new Date(fetchedAt.getTime() + cacheDurationMs()).toISOString();
  if (process.env.MARKET_DATA_FETCH_ENABLED === "false") {
    return {
      configured: false,
      availability: "UNCONFIGURED",
      provider: "PUBLIC_SOURCES",
      priceBasis: "PREVIOUS_CLOSE",
      sources: ["TENCENT_FINANCE", "EASTMONEY"],
      fetchedAt: fetchedAt.toISOString(),
      cacheExpiresAt,
      message: "Public market-data requests are disabled in this environment.",
      items: makeEmptyItems(),
    };
  }

  const financials = await mapWithConcurrency(
    comparableUniverse,
    4,
    fetchFinancialSnapshot,
  );
  const financialByTicker = new Map(
    comparableUniverse.map((security, index) => [security.ticker, financials[index]]),
  );
  const histories = await mapWithConcurrency(comparableUniverse, 6, async (security) => {
    try {
      return await fetchTencentKlineHistory(security);
    } catch {
      return [];
    }
  });
  const historyByTicker = new Map(
    comparableUniverse.map((security, index) => [security.ticker, histories[index]]),
  );

  let quotes = new Map<string, TencentQuote>();
  let quoteSourceAvailable = true;
  try {
    quotes = await fetchTencentQuotes();
  } catch {
    quoteSourceAvailable = false;
  }

  const items = comparableUniverse.map((security) => {
    const quote = quotes.get(tencentSymbol(security));
    const financial = financialByTicker.get(security.ticker);
    const performance = calculateTencentPricePerformance(historyByTicker.get(security.ticker) ?? []);
    const price = performance.price ?? quote?.previousClose ?? null;
    const marketCap = quote?.marketCap ?? null;
    const hasAnyData = [
      price,
      marketCap,
      financial?.revenue,
      financial?.grossMargin,
      financial?.netMargin,
    ].some((value) => value !== null && value !== undefined);
    return {
      ticker: security.ticker,
      name: security.name,
      market: security.market,
      currency: security.currency,
      financialCurrency: financial?.financialCurrency ?? security.currency,
      price,
      priceChangePercent: performance.priceChangePercent,
      thirtyDayChangePercent: performance.thirtyDayChangePercent,
      yearToDateChangePercent: performance.yearToDateChangePercent,
      marketCap,
      revenue: financial?.revenue ?? null,
      grossMargin: financial?.grossMargin ?? null,
      netMargin: financial?.netMargin ?? null,
      priceAsOf: performance.priceAsOf ?? (price === null ? null : priorBusinessDay()),
      financialPeriod: financial?.financialPeriod ?? null,
      financialAsOf: financial?.financialAsOf ?? null,
      dataStatus: hasAnyData ? "AVAILABLE" : "UNAVAILABLE",
    } satisfies ComparableMarketRecord;
  });
  const unavailableCount = items.filter((item) => item.dataStatus === "UNAVAILABLE").length;
  const message = !quoteSourceAvailable
    ? "Public quote source is temporarily unavailable. Financial data remains available where reported."
    : unavailableCount === 0
      ? null
      : `${unavailableCount} instruments are temporarily unavailable from public sources. Missing values are left blank.`;
  return {
    configured: true,
    availability: items.some((item) => item.dataStatus === "AVAILABLE")
      ? "LIVE"
      : "UNAVAILABLE",
    provider: "PUBLIC_SOURCES",
    priceBasis: "PREVIOUS_CLOSE",
    sources: ["TENCENT_FINANCE", "EASTMONEY"],
    fetchedAt: fetchedAt.toISOString(),
    cacheExpiresAt,
    message,
    items,
  };
}

export async function getComparableMarketData(options?: { forceRefresh?: boolean }) {
  if (!options?.forceRefresh && cache && cache.expiresAt > Date.now()) {
    return cache.result;
  }
  if (!options?.forceRefresh && inFlight) return inFlight;

  const request = loadComparableMarketData().then((result) => {
    cache = { result, expiresAt: new Date(result.cacheExpiresAt).getTime() };
    return result;
  });
  inFlight = request;
  try {
    return await request;
  } finally {
    if (inFlight === request) inFlight = null;
  }
}
