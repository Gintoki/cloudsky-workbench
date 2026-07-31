import { describe, expect, it } from "vitest";
import { parseTencentQuotes } from "../../lib/market-data/comparables";

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
});
