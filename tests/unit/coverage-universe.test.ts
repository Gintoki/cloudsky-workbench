import { describe, expect, it } from "vitest";
import { comparableUniverse } from "../../lib/market-data/coverage-universe";

describe("comparable universe", () => {
  it("keeps the Command Center watchlist uniquely mapped to tickers", () => {
    expect(comparableUniverse).toHaveLength(25);
    expect(new Set(comparableUniverse.map((security) => security.ticker)).size).toBe(
      comparableUniverse.length,
    );
  });

  it("uses market-specific tickers and currencies", () => {
    expect(comparableUniverse.find((security) => security.ticker === "600845"))
      .toMatchObject({ market: "CN", currency: "CNY" });
    expect(comparableUniverse.find((security) => security.ticker === "0268"))
      .toMatchObject({ market: "HK", currency: "HKD" });
    expect(comparableUniverse.find((security) => security.ticker === "NET"))
      .toMatchObject({ market: "US", currency: "USD" });
  });
});
