import type { ComparableSecurity } from "@/lib/market-data/coverage-universe";

type FetchLike = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

type CninfoSearchResponse = {
  keyBoardList?: Array<{ code?: string; orgId?: string; plate?: string }>;
};

type CninfoAnnouncement = {
  announcementTitle?: string;
  announcementTime?: number;
  adjunctUrl?: string;
};

type CninfoAnnouncementResponse = {
  announcements?: CninfoAnnouncement[];
};

type SecTicker = { cik_str?: number; ticker?: string };

type SecSubmissions = {
  filings?: {
    recent?: {
      form?: string[];
      reportDate?: string[];
      accessionNumber?: string[];
      primaryDocument?: string[];
    };
  };
};

type HkexStockSearchResponse = {
  stockInfo?: Array<{ stockId?: number; code?: string }>;
};

type HkexTitleSearchResponse = {
  result?: string;
};

type HkexFiling = {
  TITLE?: string;
  FILE_LINK?: string;
  DATE_TIME?: string;
};

export type VerifiedAnnualReportLink = {
  fiscalYear: number;
  downloadUrl: string;
  reportDate: string | null;
  publisher: string;
  title: string;
};

const cninfoHeaders = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Origin: "https://www.cninfo.com.cn",
  Referer: "https://www.cninfo.com.cn/new/commonUrl?url=disclosure/list/notice",
  "User-Agent": "CloudSky Intelligence OS annual-report sync",
  "X-Requested-With": "XMLHttpRequest",
};

const secHeaders = {
  Accept: "application/json",
  "User-Agent": "CloudSky Intelligence OS annual-report sync research@cloudsky.local",
};

function fiscalYearFromTitle(title: string | undefined) {
  const match = title?.match(/(20\d{2})年年度报告/);
  return match ? Number(match[1]) : null;
}

export function selectCninfoAnnualReports(
  announcements: CninfoAnnouncement[],
): VerifiedAnnualReportLink[] {
  const byYear = new Map<number, VerifiedAnnualReportLink>();
  for (const announcement of announcements) {
    const fiscalYear = fiscalYearFromTitle(announcement.announcementTitle);
    const title = announcement.announcementTitle?.trim();
    if (
      fiscalYear === null
      || !title
      || !announcement.adjunctUrl
      || /摘要|英文|取消|更正/.test(title)
    ) continue;
    const current = byYear.get(fiscalYear);
    const candidate = {
      fiscalYear,
      downloadUrl: `https://static.cninfo.com.cn/${announcement.adjunctUrl.replace(/^\//, "")}`,
      reportDate: announcement.announcementTime
        ? new Date(announcement.announcementTime).toISOString().slice(0, 10)
        : null,
      publisher: "巨潮资讯网",
      title,
    };
    if (!current || (candidate.reportDate ?? "") > (current.reportDate ?? "")) {
      byYear.set(fiscalYear, candidate);
    }
  }
  return [...byYear.values()]
    .sort((left, right) => right.fiscalYear - left.fiscalYear)
    .slice(0, 5)
    .sort((left, right) => left.fiscalYear - right.fiscalYear);
}

export function selectSecAnnualReports(
  cik: string,
  filings: SecSubmissions,
): VerifiedAnnualReportLink[] {
  const recent = filings.filings?.recent;
  const forms = recent?.form ?? [];
  const reportDates = recent?.reportDate ?? [];
  const accessionNumbers = recent?.accessionNumber ?? [];
  const primaryDocuments = recent?.primaryDocument ?? [];
  const byYear = new Map<number, VerifiedAnnualReportLink>();
  for (let index = 0; index < forms.length; index += 1) {
    const form = forms[index];
    const reportDate = reportDates[index];
    const accessionNumber = accessionNumbers[index];
    const primaryDocument = primaryDocuments[index];
    if (
      !form
      || !reportDate
      || !accessionNumber
      || !primaryDocument
      || !["10-K", "20-F", "40-F", "1-K"].includes(form)
    ) continue;
    const fiscalYear = Number(reportDate.slice(0, 4));
    if (!Number.isInteger(fiscalYear)) continue;
    const documentUrl = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${primaryDocument}`;
    if (!byYear.has(fiscalYear)) {
      byYear.set(fiscalYear, {
        fiscalYear,
        downloadUrl: documentUrl,
        reportDate,
        publisher: "SEC EDGAR",
        title: `${form} annual filing for ${reportDate}`,
      });
    }
  }
  return [...byYear.values()]
    .sort((left, right) => right.fiscalYear - left.fiscalYear)
    .slice(0, 5)
    .sort((left, right) => left.fiscalYear - right.fiscalYear);
}

function hkexDate(value: string | undefined) {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(20\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function hkexFiscalYear(title: string | undefined) {
  const match = title?.match(/(?:^|\s)(20\d{2})\s+annual report\b/i)
    ?? title?.match(/annual report\s+(20\d{2})\b/i);
  return match ? Number(match[1]) : null;
}

export function selectHkexAnnualReports(filings: HkexFiling[]): VerifiedAnnualReportLink[] {
  const byYear = new Map<number, VerifiedAnnualReportLink>();
  for (const filing of filings) {
    const fiscalYear = hkexFiscalYear(filing.TITLE);
    const title = filing.TITLE?.trim();
    if (fiscalYear === null || !title || !filing.FILE_LINK) continue;
    const candidate = {
      fiscalYear,
      downloadUrl: new URL(filing.FILE_LINK, "https://www1.hkexnews.hk").toString(),
      reportDate: hkexDate(filing.DATE_TIME),
      publisher: "HKEXnews",
      title,
    };
    const current = byYear.get(fiscalYear);
    if (!current || (candidate.reportDate ?? "") > (current.reportDate ?? "")) {
      byYear.set(fiscalYear, candidate);
    }
  }
  return [...byYear.values()]
    .sort((left, right) => right.fiscalYear - left.fiscalYear)
    .slice(0, 5)
    .sort((left, right) => left.fiscalYear - right.fiscalYear);
}

function parseHkexJsonp(value: string) {
  const first = value.indexOf("(");
  const last = value.lastIndexOf(")");
  if (first < 0 || last <= first) throw new Error("HKEX stock lookup returned invalid JSONP");
  return JSON.parse(value.slice(first + 1, last)) as HkexStockSearchResponse;
}

async function fetchCninfoAnnualReports(
  security: ComparableSecurity,
  fetchImpl: FetchLike,
) {
  const searchResponse = await fetchImpl(
    "https://www.cninfo.com.cn/new/information/topSearch/detailOfQuery",
    {
      method: "POST",
      headers: cninfoHeaders,
      body: new URLSearchParams({ keyWord: security.ticker, maxSecNum: "10", maxListNum: "5" }),
    },
  );
  if (!searchResponse.ok) throw new Error(`CNINFO search failed with status ${searchResponse.status}`);
  const search = await searchResponse.json() as CninfoSearchResponse;
  const match = search.keyBoardList?.find((item) => item.code === security.ticker);
  if (!match?.code || !match.orgId || !match.plate) return [];

  const announcementResponse = await fetchImpl(
    "https://www.cninfo.com.cn/new/hisAnnouncement/query",
    {
      method: "POST",
      headers: cninfoHeaders,
      body: new URLSearchParams({
        stock: `${match.code},${match.orgId}`,
        tabName: "fulltext",
        pageSize: "30",
        pageNum: "1",
        column: match.plate,
        category: "category_ndbg_szsh;",
        plate: "",
        seDate: "",
        searchkey: "",
        secid: "",
        sortName: "",
        sortType: "",
        isHLtitle: "true",
      }),
    },
  );
  if (!announcementResponse.ok) {
    throw new Error(`CNINFO announcement search failed with status ${announcementResponse.status}`);
  }
  const announcements = await announcementResponse.json() as CninfoAnnouncementResponse;
  return selectCninfoAnnualReports(announcements.announcements ?? []);
}

async function fetchSecAnnualReports(
  security: ComparableSecurity,
  fetchImpl: FetchLike,
) {
  const tickersResponse = await fetchImpl("https://www.sec.gov/files/company_tickers.json", {
    headers: secHeaders,
  });
  if (!tickersResponse.ok) throw new Error(`SEC ticker lookup failed with status ${tickersResponse.status}`);
  const tickers = await tickersResponse.json() as Record<string, SecTicker>;
  const match = Object.values(tickers).find(
    (item) => item.ticker?.toUpperCase() === security.ticker.toUpperCase(),
  );
  if (!match?.cik_str) return [];
  const cik = String(match.cik_str).padStart(10, "0");
  const submissionsResponse = await fetchImpl(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: secHeaders,
  });
  if (!submissionsResponse.ok) throw new Error(`SEC filings lookup failed with status ${submissionsResponse.status}`);
  return selectSecAnnualReports(cik, await submissionsResponse.json() as SecSubmissions);
}

async function fetchHkexAnnualReports(
  security: ComparableSecurity,
  fetchImpl: FetchLike,
) {
  const stockCode = security.ticker.padStart(5, "0");
  const stockResponse = await fetchImpl(
    `https://www1.hkexnews.hk/search/partial.do?${new URLSearchParams({
      lang: "EN",
      type: "A",
      name: stockCode,
      market: "SEHK",
      callback: "callback",
    })}`,
    { headers: { "User-Agent": cninfoHeaders["User-Agent"] } },
  );
  if (!stockResponse.ok) throw new Error(`HKEX stock lookup failed with status ${stockResponse.status}`);
  const stockSearch = parseHkexJsonp(await stockResponse.text());
  const stock = stockSearch.stockInfo?.find((item) => item.code === stockCode);
  if (!stock?.stockId) return [];

  const indexResponse = await fetchImpl(
    `https://www1.hkexnews.hk/search/titleSearchServlet.do?${new URLSearchParams({
      sortDir: "0",
      sortByOptions: "DateTime",
      category: "0",
      market: "SEHK",
      stockId: String(stock.stockId),
      documentType: "-1",
      fromDate: "19990401",
      toDate: new Date().toISOString().slice(0, 10).replaceAll("-", ""),
      title: "ANNUAL REPORT",
      searchType: "0",
      t1code: "-2",
      t2Gcode: "-2",
      t2code: "-2",
      rowRange: "100",
      lang: "en",
    })}`,
    { headers: { "User-Agent": cninfoHeaders["User-Agent"] } },
  );
  if (!indexResponse.ok) throw new Error(`HKEX annual-report lookup failed with status ${indexResponse.status}`);
  const index = await indexResponse.json() as HkexTitleSearchResponse;
  const filings = index.result ? JSON.parse(index.result) as HkexFiling[] : [];
  return selectHkexAnnualReports(filings);
}

export async function fetchVerifiedAnnualReports(
  security: ComparableSecurity,
  fetchImpl: FetchLike = fetch,
) {
  if (security.market === "CN") return fetchCninfoAnnualReports(security, fetchImpl);
  if (security.market === "US") return fetchSecAnnualReports(security, fetchImpl);
  return fetchHkexAnnualReports(security, fetchImpl);
}
