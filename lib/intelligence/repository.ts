import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import {
  companies,
  industries,
  intelligenceItemCompanies,
  intelligenceItems,
  sources,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth/types";
import type {
  ContentStatus,
  IntelligenceFilters,
  IntelligenceListResult,
  IntelligenceRecord,
  IntelligenceSourceLink,
} from "@/lib/domain/types";
import { filterIntelligence } from "./filters";
import {
  industrySeeds,
  intelligenceCompanySeeds,
  intelligenceItemSeeds,
  notionIndustryFetchedAt,
} from "./notion-industry-radar";

function shouldUseSeedData(): boolean {
  return process.env.USE_DEMO_DATA === "true" || !hasDatabase();
}

function seedRecords(): IntelligenceRecord[] {
  const categoryBySlug = new Map(
    industrySeeds.map((category) => [category.slug, category]),
  );
  const companyByName = new Map(
    intelligenceCompanySeeds.map((company) => [company.name, company]),
  );
  return intelligenceItemSeeds.map((seed) => {
    const category = categoryBySlug.get(seed.categorySlug);
    if (!category) throw new Error(`Unknown industry: ${seed.categorySlug}`);
    const linkedCompanies = seed.companyNames.map((name) => {
      const company = companyByName.get(name);
      if (!company) throw new Error(`Unknown intelligence entity: ${name}`);
      return {
        id: company.id,
        name: company.name,
        entityType: company.entityType,
        notionPageUrl: company.notionPageUrl,
      };
    });
    return {
      id: seed.id,
      title: seed.title,
      summary: seed.summary,
      details: seed.details,
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      publishedAt: seed.publishedAt,
      eventType: seed.eventType,
      relationshipToCloudsky: seed.relationshipToCloudsky,
      sourceNote: seed.sourceNote,
      notionPageUrl: seed.notionPageUrl,
      originalUrl: seed.sourceLinks[0]?.url ?? seed.notionPageUrl,
      sourceTitle: `Notion 行业雷达 · ${seed.companyNames[0]}`,
      sourceLinks: seed.sourceLinks,
      tags: seed.tags,
      status: "APPROVED" as const,
      companies: linkedCompanies,
      fetchedAt: notionIndustryFetchedAt,
    };
  });
}

async function databaseRecords(user: AuthUser): Promise<IntelligenceRecord[]> {
  const visibility =
    user.role === "VIEWER"
      ? and(
          eq(intelligenceItems.organizationId, user.organizationId),
          eq(intelligenceItems.status, "APPROVED"),
          isNull(intelligenceItems.deletedAt),
        )
      : and(
          eq(intelligenceItems.organizationId, user.organizationId),
          isNull(intelligenceItems.deletedAt),
        );
  const rows = await getDb()
    .select({
      id: intelligenceItems.id,
      title: intelligenceItems.title,
      summary: intelligenceItems.summary,
      details: intelligenceItems.details,
      categoryId: industries.id,
      categoryName: industries.name,
      categorySlug: industries.slug,
      publishedAt: intelligenceItems.publishedAt,
      eventType: intelligenceItems.eventType,
      relationshipToCloudsky: intelligenceItems.relationshipToCloudsky,
      sourceNote: intelligenceItems.sourceNote,
      notionPageUrl: intelligenceItems.notionPageUrl,
      originalUrl: intelligenceItems.originalUrl,
      sourceTitle: sources.title,
      sourceLinks: intelligenceItems.sourceLinks,
      tags: intelligenceItems.tags,
      status: intelligenceItems.status,
      fetchedAt: intelligenceItems.fetchedAt,
    })
    .from(intelligenceItems)
    .leftJoin(industries, eq(industries.id, intelligenceItems.industryId))
    .innerJoin(sources, eq(sources.id, intelligenceItems.sourceId))
    .where(visibility);

  const itemIds = rows.map((row) => row.id);
  const companyRows = itemIds.length
    ? await getDb()
        .select({
          intelligenceItemId:
            intelligenceItemCompanies.intelligenceItemId,
          id: companies.id,
          name: companies.name,
          entityType: companies.entityType,
          notionPageUrl: companies.notionPageUrl,
        })
        .from(intelligenceItemCompanies)
        .innerJoin(
          companies,
          eq(companies.id, intelligenceItemCompanies.companyId),
        )
        .where(
          and(
            inArray(intelligenceItemCompanies.intelligenceItemId, itemIds),
            isNull(companies.deletedAt),
          ),
        )
    : [];
  const companiesByItem = new Map<
    string,
    IntelligenceRecord["companies"]
  >();
  for (const row of companyRows) {
    const list = companiesByItem.get(row.intelligenceItemId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      entityType: row.entityType === "TOPIC" ? "TOPIC" : "COMPANY",
      notionPageUrl: row.notionPageUrl,
    });
    companiesByItem.set(row.intelligenceItemId, list);
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    details: row.details,
    categoryId: row.categoryId,
    categoryName: row.categoryName ?? "未分类",
    categorySlug: row.categorySlug ?? "uncategorized",
    publishedAt:
      row.publishedAt?.toISOString().slice(0, 10) ?? "1970-01-01",
    eventType: row.eventType,
    relationshipToCloudsky: row.relationshipToCloudsky,
    sourceNote: row.sourceNote,
    notionPageUrl: row.notionPageUrl,
    originalUrl: row.originalUrl,
    sourceTitle: row.sourceTitle,
    sourceLinks: (row.sourceLinks ?? []) as IntelligenceSourceLink[],
    tags: row.tags ?? [],
    status: row.status as ContentStatus,
    companies: companiesByItem.get(row.id) ?? [],
    fetchedAt: row.fetchedAt.toISOString(),
  }));
}

export async function listIntelligence(
  user: AuthUser,
  filters: IntelligenceFilters = {},
): Promise<IntelligenceListResult> {
  const records = shouldUseSeedData()
    ? seedRecords()
    : await databaseRecords(user);
  return filterIntelligence(records, filters);
}

export async function getIntelligenceItem(
  user: AuthUser,
  id: string,
): Promise<IntelligenceRecord | null> {
  const result = await listIntelligence(user);
  return result.items.find((record) => record.id === id) ?? null;
}
