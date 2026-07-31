import { describe, expect, it } from "vitest";
import type { IntelligenceRecord } from "../../lib/domain/types";
import { filterIntelligence } from "../../lib/intelligence/filters";

function record(
  id: string,
  categorySlug: string,
  categoryName: string,
  publishedAt: string,
  companyId: string,
  companyName: string,
): IntelligenceRecord {
  return {
    id,
    title: `Event ${id}`,
    summary: "Summary",
    details: "Details",
    categoryId: categorySlug,
    categoryName,
    categorySlug,
    publishedAt,
    eventType: "Update",
    relationshipToCloudsky: null,
    sourceNote: null,
    notionPageUrl: null,
    originalUrl: "https://example.com",
    sourceTitle: "Source",
    sourceLinks: [],
    tags: [],
    status: "APPROVED",
    companies: [
      {
        id: companyId,
        name: companyName,
        entityType: "COMPANY",
        notionPageUrl: null,
      },
    ],
    fetchedAt: "2026-07-30T00:00:00.000Z",
  };
}

const records = [
  record("1", "edge-cloud", "边缘云", "2026-07-10", "c1", "Cloudflare"),
  record("2", "edge-cloud", "边缘云", "2026-07-20", "c2", "PPIO"),
  record("3", "devices", "端侧设备", "2026-07-15", "c3", "小米"),
];

describe("industry intelligence filters", () => {
  it("filters by category and orders newest first", () => {
    const result = filterIntelligence(records, { category: "edge-cloud" });
    expect(result.items.map((item) => item.id)).toEqual(["2", "1"]);
    expect(result.total).toBe(2);
  });

  it("filters by linked company and supports oldest-first order", () => {
    const result = filterIntelligence(records, {
      company: "c1",
      sort: "oldest",
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].companies[0].name).toBe("Cloudflare");
  });

  it("builds category and company facets from the authorized record set", () => {
    const result = filterIntelligence(records, {});
    expect(result.categories).toEqual(
      expect.arrayContaining([
        { value: "edge-cloud", label: "边缘云", count: 2 },
        { value: "devices", label: "端侧设备", count: 1 },
      ]),
    );
    expect(result.companies).toHaveLength(3);
  });
});
