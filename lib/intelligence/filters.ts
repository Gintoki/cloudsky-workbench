import type {
  IntelligenceFacet,
  IntelligenceFilters,
  IntelligenceListResult,
  IntelligenceRecord,
} from "@/lib/domain/types";

function facets(
  records: IntelligenceRecord[],
  values: (record: IntelligenceRecord) => Array<{ value: string; label: string }>,
): IntelligenceFacet[] {
  const counts = new Map<string, IntelligenceFacet>();
  for (const record of records) {
    for (const entry of values(record)) {
      const current = counts.get(entry.value);
      counts.set(entry.value, {
        ...entry,
        count: (current?.count ?? 0) + 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "zh-CN"),
  );
}

export function filterIntelligence(
  records: IntelligenceRecord[],
  filters: IntelligenceFilters,
): IntelligenceListResult {
  const categories = facets(records, (record) => [
    { value: record.categorySlug, label: record.categoryName },
  ]);
  const companies = facets(records, (record) =>
    record.companies.map((company) => ({
      value: company.id,
      label: company.name,
    })),
  );
  const items = records
    .filter(
      (record) =>
        !filters.category || record.categorySlug === filters.category,
    )
    .filter(
      (record) =>
        !filters.company ||
        record.companies.some((company) => company.id === filters.company),
    )
    .sort((a, b) =>
      filters.sort === "oldest"
        ? a.publishedAt.localeCompare(b.publishedAt)
        : b.publishedAt.localeCompare(a.publishedAt),
    );
  return { items, categories, companies, total: items.length };
}
