import { describe, expect, it } from "vitest";
import {
  factInputSchema,
  metricInputSchema,
} from "../../lib/domain/validation";

describe("business input validation", () => {
  it("requires a source and measurement basis for facts", () => {
    const result = factInputSchema.safeParse({
      primaryCategory: "Technology",
      title: "Test fact",
      content: "This is a sufficiently long test fact without a source.",
      measurementBasis: "Test basis",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid metric periods and codes", () => {
    const result = metricInputSchema.safeParse({
      code: "invalid code",
      name: "Test metric",
      periodLabel: "2026 Q2",
      periodStart: "2026-07-01",
      periodEnd: "2026-06-30",
      value: 1,
      unit: "count",
      valueType: "ACTUAL",
      scenario: "BASE",
      frequency: "QUARTERLY",
      measurementBasis: "Test basis",
      sourceTitle: "Test source",
    });
    expect(result.success).toBe(false);
  });
});
