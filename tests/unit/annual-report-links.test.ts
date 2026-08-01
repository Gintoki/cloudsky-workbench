import { describe, expect, it } from "vitest";
import {
  fetchVerifiedAnnualReports,
  selectCninfoAnnualReports,
  selectHkexAnnualReports,
  selectSecAnnualReports,
} from "../../lib/company-research/annual-report-links";

describe("annual report links", () => {
  it("keeps only original CNINFO annual-report PDFs", () => {
    expect(selectCninfoAnnualReports([
      { announcementTitle: "2024年年度报告摘要", adjunctUrl: "finalpage/summary.pdf", announcementTime: 1710000000000 },
      { announcementTitle: "2024年年度报告", adjunctUrl: "finalpage/report.pdf", announcementTime: 1710000000000 },
      { announcementTitle: "2023年年度报告（更正后）", adjunctUrl: "finalpage/corrected.pdf", announcementTime: 1680000000000 },
    ])).toEqual([expect.objectContaining({
      fiscalYear: 2024,
      downloadUrl: "https://static.cninfo.com.cn/finalpage/report.pdf",
      publisher: "巨潮资讯网",
    })]);
  });

  it("builds direct SEC document links from annual filings", () => {
    expect(selectSecAnnualReports("0000320193", {
      filings: {
        recent: {
          form: ["10-Q", "10-K"],
          reportDate: ["2025-06-28", "2024-09-28"],
          accessionNumber: ["0000320193-25-000001", "0000320193-24-000123"],
          primaryDocument: ["quarter.htm", "annual.htm"],
        },
      },
    })).toEqual([expect.objectContaining({
      fiscalYear: 2024,
      downloadUrl: "https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/annual.htm",
      publisher: "SEC EDGAR",
    })]);
  });

  it("builds direct HKEX PDFs only from annual-report notices", () => {
    expect(selectHkexAnnualReports([
      { TITLE: "ANNUAL RESULTS ANNOUNCEMENT FOR THE YEAR ENDED 31 DECEMBER 2024", FILE_LINK: "/listedco/results.pdf", DATE_TIME: "20/03/2025 18:00" },
      { TITLE: "2024 ANNUAL REPORT", FILE_LINK: "/listedco/annual-2024.pdf", DATE_TIME: "24/04/2025 17:00" },
    ])).toEqual([expect.objectContaining({
      fiscalYear: 2024,
      downloadUrl: "https://www1.hkexnews.hk/listedco/annual-2024.pdf",
      publisher: "HKEXnews",
    })]);
  });

  it("uses a mock CNINFO response and surfaces source failures", async () => {
    const calls: string[] = [];
    const mockFetch = async (input: URL | RequestInfo) => {
      calls.push(String(input));
      return calls.length === 1
        ? Response.json({ keyBoardList: [{ code: "000725", orgId: "gssz0000725", plate: "szse" }] })
        : Response.json({ announcements: [{ announcementTitle: "2025年年度报告", adjunctUrl: "finalpage/2026-04-01/report.pdf", announcementTime: 1774972800000 }] });
    };
    const links = await fetchVerifiedAnnualReports({
      ticker: "000725", name: "京东方", market: "CN", currency: "CNY", researchNames: ["京东方"],
    }, mockFetch);
    expect(calls).toHaveLength(2);
    expect(links[0]?.downloadUrl).toContain("static.cninfo.com.cn/finalpage/2026-04-01/report.pdf");

    await expect(fetchVerifiedAnnualReports({
      ticker: "000725", name: "京东方", market: "CN", currency: "CNY", researchNames: ["京东方"],
    }, async () => new Response(null, { status: 503 }))).rejects.toThrow("CNINFO search failed");
  });
});
