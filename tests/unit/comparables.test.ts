import { describe, expect, it } from "vitest";
import {
  calculateTencentPricePerformance,
  parseTencentKlineHistory,
  parseTencentQuotes,
} from "../../lib/market-data/comparables";

describe("public comparable market data", () => {
  it("uses Tencent's previous close and converts the market cap to the prior-close basis", () => {
    const fields = Array.from({ length: 46 }, () => "");
    fields[3] = "110";
    fields[4] = "100";
    fields[45] = "10";

    const quotes = parseTencentQuotes(`v_usNET="${fields.join("~")}";`);

    expect(quotes.get("usNET")).toEqual({
      price: 110,
      previousClose: 100,
      marketCap: 909_090_909.0909091,
    });
  });

  it("calculates daily, 30-day, and year-to-date returns from public daily closes", () => {
    const history = parseTencentKlineHistory(
      {
        data: {
          sz000725: {
            qfqday: [
              ["2025-12-31", "0", "100"],
              ["2026-01-02", "0", "101"],
              ["2026-01-16", "0", "105"],
              ["2026-01-30", "0", "110"],
              ["2026-02-02", "0", "112"],
            ],
          },
        },
      },
      "sz000725",
    );

    expect(calculateTencentPricePerformance(history)).toMatchObject({
      price: 112,
      priceAsOf: "2026-02-02",
      priceChangePercent: expect.closeTo(1.8181818182, 6),
      thirtyDayChangePercent: expect.closeTo(10.8910891089, 6),
      yearToDateChangePercent: 12,
    });
  });

  it("does not derive returns when the required history is missing", () => {
    expect(calculateTencentPricePerformance([])).toMatchObject({
      price: null,
      priceChangePercent: null,
      thirtyDayChangePercent: null,
      yearToDateChangePercent: null,
    });
  });

  it("does not use a stale isolated close as a return baseline", () => {
    expect(calculateTencentPricePerformance([
      { date: "2011-06-02", close: 346.22 },
      { date: "2026-07-31", close: 308.91 },
    ])).toMatchObject({
      price: 308.91,
      priceChangePercent: null,
      thirtyDayChangePercent: null,
      yearToDateChangePercent: null,
    });
  });
});
