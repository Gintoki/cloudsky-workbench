import { describe, expect, it } from "vitest";
import {
  createResearchReportSchema,
  researchTransitionSchema,
  updateResearchReportSchema,
} from "../../lib/company-research/validation";

const companyId = "00000000-0000-4000-8000-000000000001";

describe("company research validation", () => {
  it("accepts a sourced draft update with an explicit change summary", () => {
    const value = updateResearchReportSchema.parse({
      conclusion: "WATCH",
      conclusionSummary: "需要验证续费和现金转换。",
      confidence: 55,
      changeSummary: "补充首轮研究判断",
      sections: [
        {
          code: "overview",
          content: "该结论尚待来源核验。",
          claimKind: "INFERENCE",
        },
      ],
    });
    expect(value.conclusion).toBe("WATCH");
    expect(value.sections?.[0].claimKind).toBe("INFERENCE");
  });

  it("limits core assumptions to seven and requires a change summary", () => {
    const assumptions = Array.from({ length: 8 }, (_, index) => ({
      title: `可验证假设 ${index + 1}`,
      status: "OPEN",
      claimKind: "INFERENCE",
    }));
    expect(
      updateResearchReportSchema.safeParse({
        changeSummary: "a",
        assumptions,
      }).success,
    ).toBe(false);
  });

  it("only permits the defined report transitions", () => {
    expect(createResearchReportSchema.parse({ companyId }).companyId).toBe(companyId);
    expect(researchTransitionSchema.safeParse({ action: "SUBMIT" }).success).toBe(true);
    expect(researchTransitionSchema.safeParse({ action: "DELETE" }).success).toBe(false);
  });
});
