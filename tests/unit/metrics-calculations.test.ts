import { describe, expect, it } from "vitest";
import { percentChange } from "../../lib/metrics/calculations";

describe("percentChange", () => {
  it("calculates period change", () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(90, 100)).toBeCloseTo(-0.1);
  });

  it("does not fabricate a comparison for missing or zero bases", () => {
    expect(percentChange(120, 0)).toBeNull();
    expect(percentChange(120, null)).toBeNull();
    expect(percentChange(undefined, 100)).toBeNull();
  });
});
