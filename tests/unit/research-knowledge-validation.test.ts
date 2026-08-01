import { describe, expect, it } from "vitest";
import { researchItemInputSchema } from "../../lib/research-knowledge/validation";

const validInput = {
  dimension: "BUSINESS_MODEL",
  subtype: "BUSINESS_MODEL_CASE",
  title: "公开案例研究",
  summary: "基于原始来源建立的商业模式研究判断。",
  whatHappened: "已将公开产品资料整理为一条可追溯研究条目。",
  whyItMatters: "它可以帮助团队比较产品、收费和成本结构。",
  cloudskyImplication: "需要以客户和单位经济数据验证能否复制。",
  recommendedAction: "补充访谈并形成验证计划。",
  eventDate: "2026-08-01",
  importance: "MEDIUM",
  confidence: "MEDIUM",
  status: "INBOX",
  nextAction: "补充客户访谈并形成行动计划。",
  nextFollowUpDate: "2026-08-15",
  organizations: [],
  sources: [
    {
      sourceType: "官方公开资料",
      title: "产品文档",
      url: "https://example.com/docs",
    },
  ],
};

describe("researchItemInputSchema", () => {
  it("accepts a source-backed research judgement", () => {
    expect(researchItemInputSchema.parse(validInput)).toMatchObject({
      dimension: "BUSINESS_MODEL",
      subtype: "BUSINESS_MODEL_CASE",
    });
  });

  it("rejects a subtype that does not belong to its module", () => {
    expect(() =>
      researchItemInputSchema.parse({
        ...validInput,
        dimension: "MARKET",
      }),
    ).toThrow();
  });

  it("requires at least one original source", () => {
    expect(() =>
      researchItemInputSchema.parse({ ...validInput, sources: [] }),
    ).toThrow();
  });
});
