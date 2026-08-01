import { describe, expect, it } from "vitest";
import {
  investorAccountSchema,
  roadshowRecordSchema,
} from "../../lib/investor-relations/validation";

describe("investor relations validation", () => {
  it("accepts an investor account with an optional primary contact", () => {
    const account = investorAccountSchema.parse({
      name: "示例投资机构",
      investorType: "FUND",
      relationshipStage: "ENGAGED",
      primaryContact: { name: "王经理", email: "wang@example.com" },
    });
    expect(account.primaryContact?.name).toBe("王经理");
    expect(account.relationshipStage).toBe("ENGAGED");
  });

  it("accepts time-coded roadshow notes and rejects reversed time ranges", () => {
    const valid = roadshowRecordSchema.parse({
      investorAccountId: "00000000-0000-4000-8000-000000000001",
      title: "季度沟通",
      occurredAt: "2026-08-01T10:00:00.000Z",
      segments: [{ startSeconds: 15, endSeconds: 42, content: "讨论核心经营问题。" }],
    });
    expect(valid.segments).toHaveLength(1);
    expect(
      roadshowRecordSchema.safeParse({
        investorAccountId: "00000000-0000-4000-8000-000000000001",
        title: "季度沟通",
        occurredAt: "2026-08-01T10:00:00.000Z",
        segments: [{ startSeconds: 42, endSeconds: 15, content: "无效时间轴" }],
      }).success,
    ).toBe(false);
  });
});
