import type { ComparableSecurity } from "./coverage-universe";

const EASTMONEY_DATA_URL = "https://datacenter-web.eastmoney.com/api/data/v1/get";
const EASTMONEY_SEARCH_URL = "https://searchapi.eastmoney.com/api/suggest/get";
const EASTMONEY_SEARCH_TOKEN = "D43BF722C8E33BDC906FB84D85E326E8";

type EastmoneyRecord = Record<string, unknown>;

type EastmoneyDataResponse = {
  success?: boolean;
  result?: { data?: EastmoneyRecord[] | null } | null;
};

type EastmoneySearchResponse = {
  QuotationCodeTable?: {
    Data?: Array<{ Code?: string; Classify?: string; MktNum?: string }>;
  };
};

export type AnnualFinancialHistoryRecord = {
  fiscalYear: number;
  currency: "USD" | "CNY" | "HKD";
  revenue: number | null;
  grossMargin: number | null;
  netIncome: number | null;
  netMargin: number | null;
  sourceUrl: string;
};

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || normalized === "--" || normalized === "-") return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function stringValue(value: unknown) {
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

function dataUrl(reportName: string, filter: string) {
  const url = new URL(EASTMONEY_DATA_URL);
  url.searchParams.set("reportName", reportName);
  url.searchParams.set("columns", "ALL");
  url.searchParams.set("filter", filter);
  url.searchParams.set("pageNumber", "1");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("source", "WEB");
  url.searchParams.set("client", "WEB");
  return url.toString();
}

async function fetchEastmoneyData(reportName: string, filter: string) {
  const url = dataUrl(reportName, filter);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Eastmoney request failed with status ${response.status}`);
  const data = (await response.json()) as EastmoneyDataResponse;
  return { rows: data.success ? data.result?.data ?? [] : [], url };
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
      candidate.Code?.toUpperCase() === ticker.toUpperCase() &&
      candidate.Classify === "UsStock" &&
      (candidate.MktNum === "105" || candidate.MktNum === "106" || candidate.MktNum === "107"),
  );
  const suffix = match?.MktNum === "105" ? "O" : match?.MktNum === "106" ? "N" : match?.MktNum === "107" ? "A" : null;
  return suffix ? `${ticker.toUpperCase()}.${suffix}` : null;
}

function fiscalYear(record: EastmoneyRecord) {
  const period = stringValue(record.QDATE)
    ?? stringValue(record.REPORT_DATE)
    ?? stringValue(record.REPORTDATE)
    ?? stringValue(record.REPORT_DATE_NAME);
  const match = period?.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function isAnnualChina(record: EastmoneyRecord) {
  const quarter = stringValue(record.QDATE);
  if (quarter?.endsWith("Q4")) return true;
  const dateMarker = stringValue(record.DATEMMDD) ?? stringValue(record.REPORT_TYPE);
  return dateMarker === "年报" || dateMarker === "12-31";
}

function isAnnualGlobal(record: EastmoneyRecord) {
  const type = stringValue(record.DATE_TYPE_CODE)
    ?? stringValue(record.DATE_TYPE)
    ?? stringValue(record.REPORT_TYPE)
    ?? stringValue(record.REPORT_DATA_TYPE);
  return type === "001" || type === "年报" || type?.toUpperCase() === "ANNUAL";
}

function mostRecentFive(records: AnnualFinancialHistoryRecord[]) {
  const uniqueByYear = new Map<number, AnnualFinancialHistoryRecord>();
  for (const record of records) {
    const current = uniqueByYear.get(record.fiscalYear);
    const score = [record.revenue, record.grossMargin, record.netIncome, record.netMargin]
      .filter((value) => value !== null).length;
    const currentScore = current
      ? [current.revenue, current.grossMargin, current.netIncome, current.netMargin]
          .filter((value) => value !== null).length
      : -1;
    if (!current || score > currentScore) uniqueByYear.set(record.fiscalYear, record);
  }
  return [...uniqueByYear.values()]
    .sort((left, right) => right.fiscalYear - left.fiscalYear)
    .slice(0, 5)
    .sort((left, right) => left.fiscalYear - right.fiscalYear);
}

function chinaHistory(rows: EastmoneyRecord[], sourceUrl: string) {
  return mostRecentFive(
    rows
      .filter(isAnnualChina)
      .map((row): AnnualFinancialHistoryRecord | null => {
        const year = fiscalYear(row);
        const revenue = readNumber(row.TOTAL_OPERATE_INCOME);
        const netIncome = readNumber(row.PARENT_NETPROFIT);
        return year === null ? null : {
          fiscalYear: year,
          currency: "CNY",
          revenue,
          grossMargin: toRatio(row.XSMLL),
          netIncome,
          netMargin: ratio(netIncome, revenue),
          sourceUrl,
        };
      })
      .filter((record): record is AnnualFinancialHistoryRecord => record !== null),
  );
}

function globalHistory(
  rows: EastmoneyRecord[],
  sourceUrl: string,
  fallbackCurrency: "USD" | "HKD",
  netIncomeField: "PARENT_HOLDER_NETPROFIT" | "HOLDER_PROFIT",
) {
  return mostRecentFive(
    rows
      .filter(isAnnualGlobal)
      .map((row): AnnualFinancialHistoryRecord | null => {
        const year = fiscalYear(row);
        const currency = stringValue(row.CURRENCY_ABBR);
        return year === null ? null : {
          fiscalYear: year,
          currency: currency === "USD" || currency === "HKD" ? currency : fallbackCurrency,
          revenue: readNumber(row.OPERATE_INCOME),
          grossMargin: toRatio(row.GROSS_PROFIT_RATIO),
          netIncome: readNumber(row[netIncomeField]),
          netMargin: toRatio(row.NET_PROFIT_RATIO),
          sourceUrl,
        };
      })
      .filter((record): record is AnnualFinancialHistoryRecord => record !== null),
  );
}

export async function fetchAnnualFinancialHistory(security: ComparableSecurity) {
  if (security.market === "CN") {
    const response = await fetchEastmoneyData(
      "RPT_LICO_FN_CPD",
      `(SECURITY_CODE="${security.ticker}")`,
    );
    return chinaHistory(response.rows, response.url);
  }

  const secuCode = security.market === "HK"
    ? `${security.ticker.padStart(5, "0")}.HK`
    : await resolveUsSecuCode(security.ticker);
  if (!secuCode) return [];
  const response = await fetchEastmoneyData(
    security.market === "HK" ? "RPT_HKF10_FN_GMAININDICATOR" : "RPT_USF10_FN_GMAININDICATOR",
    `(SECUCODE="${secuCode}")`,
  );
  return globalHistory(
    response.rows,
    response.url,
    security.market === "HK" ? "HKD" : "USD",
    security.market === "HK" ? "HOLDER_PROFIT" : "PARENT_HOLDER_NETPROFIT",
  );
}
