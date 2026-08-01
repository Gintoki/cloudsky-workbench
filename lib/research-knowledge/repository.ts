import { and, desc, eq, gte, inArray, ne, or } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import {
  auditLogs,
  researchItemOrganizations,
  researchItems,
  researchItemVersions,
  researchOrganizations,
  researchSources,
  users,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth/types";
import {
  dimensionMeta,
  type ResearchDimension,
  type ResearchItemInput,
  type ResearchItemRecord,
  type ResearchKnowledgeListResult,
  type ResearchOrganizationRecord,
  type ResearchSourceRecord,
  type ResearchVersionRecord,
} from "./types";

type ResearchFilters = {
  dimension?: ResearchDimension;
  status?: string;
  days?: number;
};

function visibleTo(user: AuthUser) {
  const base = eq(researchItems.organizationId, user.organizationId);
  if (user.role !== "VIEWER") return base;
  return and(
    base,
    or(
      eq(researchItems.status, "REVIEWED"),
      eq(researchItems.status, "TRACKING"),
      eq(researchItems.status, "ACTION_REQUIRED"),
    ),
  );
}

function serializeItem(row: {
  id: string;
  dimension: string;
  subtype: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  cloudskyImplication: string;
  recommendedAction: string;
  eventDate: string;
  importance: string;
  confidence: string;
  status: string;
  ownerUserId: string | null;
  nextAction: string | null;
  nextFollowUpDate: string | null;
  details: unknown;
  currentVersionNo: number;
  createdAt: Date;
  updatedAt: Date;
  ownerName: string | null;
}): ResearchItemRecord {
  return {
    ...row,
    dimension: row.dimension as ResearchDimension,
    importance: row.importance as ResearchItemRecord["importance"],
    confidence: row.confidence as ResearchItemRecord["confidence"],
    status: row.status as ResearchItemRecord["status"],
    details:
      row.details && typeof row.details === "object" && !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sources: [],
    organizations: [],
  };
}

async function attachChildren(
  organizationId: string,
  records: ResearchItemRecord[],
  withVersions = false,
): Promise<ResearchItemRecord[]> {
  if (records.length === 0) return records;
  const db = getDb();
  const ids = records.map((item) => item.id);
  const [sourceRows, organizationRows, versionRows] = await Promise.all([
    db
      .select()
      .from(researchSources)
      .where(inArray(researchSources.researchItemId, ids)),
    db
      .select({
        researchItemId: researchItemOrganizations.researchItemId,
        relationship: researchItemOrganizations.relationship,
        id: researchOrganizations.id,
        name: researchOrganizations.name,
        organizationType: researchOrganizations.organizationType,
        country: researchOrganizations.country,
        website: researchOrganizations.website,
        description: researchOrganizations.description,
      })
      .from(researchItemOrganizations)
      .innerJoin(
        researchOrganizations,
        eq(researchOrganizations.id, researchItemOrganizations.researchOrganizationId),
      )
      .where(
        and(
          inArray(researchItemOrganizations.researchItemId, ids),
          eq(researchOrganizations.organizationId, organizationId),
        ),
      ),
    withVersions
      ? db
          .select({
            id: researchItemVersions.id,
            researchItemId: researchItemVersions.researchItemId,
            versionNo: researchItemVersions.versionNo,
            changeSummary: researchItemVersions.changeSummary,
            createdAt: researchItemVersions.createdAt,
            createdByName: users.displayName,
          })
          .from(researchItemVersions)
          .leftJoin(users, eq(users.id, researchItemVersions.createdBy))
          .where(inArray(researchItemVersions.researchItemId, ids))
          .orderBy(desc(researchItemVersions.versionNo))
      : Promise.resolve([]),
  ]);
  const sourceMap = new Map<string, ResearchSourceRecord[]>();
  for (const source of sourceRows) {
    const bucket = sourceMap.get(source.researchItemId) ?? [];
    bucket.push({
      id: source.id,
      sourceType: source.sourceType,
      title: source.title,
      url: source.url,
      filePath: source.filePath,
      publisher: source.publisher,
      publishedAt: source.publishedAt?.toISOString() ?? null,
      pageNumber: source.pageNumber,
      quotedText: source.quotedText,
    });
    sourceMap.set(source.researchItemId, bucket);
  }
  const organizationMap = new Map<string, ResearchOrganizationRecord[]>();
  for (const organization of organizationRows) {
    const bucket = organizationMap.get(organization.researchItemId) ?? [];
    bucket.push({
      id: organization.id,
      name: organization.name,
      organizationType: organization.organizationType,
      country: organization.country,
      website: organization.website,
      description: organization.description,
      relationship: organization.relationship,
    });
    organizationMap.set(organization.researchItemId, bucket);
  }
  const versionMap = new Map<string, ResearchVersionRecord[]>();
  for (const version of versionRows) {
    const bucket = versionMap.get(version.researchItemId) ?? [];
    bucket.push({
      id: version.id,
      versionNo: version.versionNo,
      changeSummary: version.changeSummary,
      createdByName: version.createdByName,
      createdAt: version.createdAt.toISOString(),
    });
    versionMap.set(version.researchItemId, bucket);
  }
  return records.map((item) => ({
    ...item,
    sources: sourceMap.get(item.id) ?? [],
    organizations: organizationMap.get(item.id) ?? [],
    ...(withVersions ? { versions: versionMap.get(item.id) ?? [] } : {}),
  }));
}

export async function listResearchItems(
  user: AuthUser,
  filters: ResearchFilters = {},
): Promise<ResearchKnowledgeListResult> {
  if (!hasDatabase()) {
    return {
      items: [],
      modules: Object.keys(dimensionMeta).map((dimension) => ({
        dimension: dimension as ResearchDimension,
        total: 0,
        weekNew: 0,
        highImportance: 0,
        actionRequired: 0,
        latestUpdatedAt: null,
      })),
      total: 0,
      pendingReview: 0,
      upcomingFollowUps: [],
      suggestedActions: [],
    };
  }
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const from = filters.days
    ? new Date(dayStart.getTime() - (filters.days - 1) * 86_400_000)
      .toISOString()
      .slice(0, 10)
    : null;
  const conditions = [visibleTo(user)];
  if (filters.dimension) conditions.push(eq(researchItems.dimension, filters.dimension));
  if (filters.status) conditions.push(eq(researchItems.status, filters.status as never));
  if (from) conditions.push(gte(researchItems.eventDate, from));
  const rows = await getDb()
    .select({
      id: researchItems.id,
      dimension: researchItems.dimension,
      subtype: researchItems.subtype,
      title: researchItems.title,
      summary: researchItems.summary,
      whatHappened: researchItems.whatHappened,
      whyItMatters: researchItems.whyItMatters,
      cloudskyImplication: researchItems.cloudskyImplication,
      recommendedAction: researchItems.recommendedAction,
      eventDate: researchItems.eventDate,
      importance: researchItems.importance,
      confidence: researchItems.confidence,
      status: researchItems.status,
      ownerUserId: researchItems.ownerUserId,
      nextAction: researchItems.nextAction,
      nextFollowUpDate: researchItems.nextFollowUpDate,
      details: researchItems.details,
      currentVersionNo: researchItems.currentVersionNo,
      createdAt: researchItems.createdAt,
      updatedAt: researchItems.updatedAt,
      ownerName: users.displayName,
    })
    .from(researchItems)
    .leftJoin(users, eq(users.id, researchItems.ownerUserId))
    .where(and(...conditions))
    .orderBy(desc(researchItems.eventDate), desc(researchItems.updatedAt));

  const items = await attachChildren(
    user.organizationId,
    rows.map(serializeItem),
  );
  const weekStart = new Date(dayStart.getTime() - 6 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const upcomingLimit = new Date(dayStart.getTime() + 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return {
    items,
    modules: Object.keys(dimensionMeta).map((dimension) => {
      const moduleItems = items.filter((item) => item.dimension === dimension);
      return {
        dimension: dimension as ResearchDimension,
        total: moduleItems.length,
        weekNew: moduleItems.filter((item) => item.eventDate >= weekStart).length,
        highImportance: moduleItems.filter(
          (item) => item.importance === "HIGH" || item.importance === "CRITICAL",
        ).length,
        actionRequired: moduleItems.filter(
          (item) => item.status === "ACTION_REQUIRED",
        ).length,
        latestUpdatedAt: moduleItems[0]?.updatedAt ?? null,
      };
    }),
    total: items.length,
    pendingReview: items.filter((item) => item.status === "INBOX").length,
    upcomingFollowUps: items.filter(
      (item) =>
        item.nextFollowUpDate !== null &&
        item.nextFollowUpDate >= dayStart.toISOString().slice(0, 10) &&
        item.nextFollowUpDate <= upcomingLimit,
    ),
    suggestedActions: items
      .filter((item) => item.status === "ACTION_REQUIRED" || item.nextAction)
      .slice(0, 3),
  };
}

export async function getResearchItem(
  user: AuthUser,
  itemId: string,
): Promise<ResearchItemRecord | null> {
  if (!hasDatabase()) return null;
  const [row] = await getDb()
    .select({
      id: researchItems.id,
      dimension: researchItems.dimension,
      subtype: researchItems.subtype,
      title: researchItems.title,
      summary: researchItems.summary,
      whatHappened: researchItems.whatHappened,
      whyItMatters: researchItems.whyItMatters,
      cloudskyImplication: researchItems.cloudskyImplication,
      recommendedAction: researchItems.recommendedAction,
      eventDate: researchItems.eventDate,
      importance: researchItems.importance,
      confidence: researchItems.confidence,
      status: researchItems.status,
      ownerUserId: researchItems.ownerUserId,
      nextAction: researchItems.nextAction,
      nextFollowUpDate: researchItems.nextFollowUpDate,
      details: researchItems.details,
      currentVersionNo: researchItems.currentVersionNo,
      createdAt: researchItems.createdAt,
      updatedAt: researchItems.updatedAt,
      ownerName: users.displayName,
    })
    .from(researchItems)
    .leftJoin(users, eq(users.id, researchItems.ownerUserId))
    .where(and(eq(researchItems.id, itemId), visibleTo(user)))
    .limit(1);
  if (!row) return null;
  const [item] = await attachChildren(user.organizationId, [serializeItem(row)], true);
  const related = await getDb()
    .select({
      id: researchItems.id,
      dimension: researchItems.dimension,
      subtype: researchItems.subtype,
      title: researchItems.title,
      summary: researchItems.summary,
      whatHappened: researchItems.whatHappened,
      whyItMatters: researchItems.whyItMatters,
      cloudskyImplication: researchItems.cloudskyImplication,
      recommendedAction: researchItems.recommendedAction,
      eventDate: researchItems.eventDate,
      importance: researchItems.importance,
      confidence: researchItems.confidence,
      status: researchItems.status,
      ownerUserId: researchItems.ownerUserId,
      nextAction: researchItems.nextAction,
      nextFollowUpDate: researchItems.nextFollowUpDate,
      details: researchItems.details,
      currentVersionNo: researchItems.currentVersionNo,
      createdAt: researchItems.createdAt,
      updatedAt: researchItems.updatedAt,
      ownerName: users.displayName,
    })
    .from(researchItems)
    .leftJoin(users, eq(users.id, researchItems.ownerUserId))
    .where(
      and(
        visibleTo(user),
        eq(researchItems.dimension, row.dimension),
        ne(researchItems.id, itemId),
      ),
    )
    .orderBy(desc(researchItems.eventDate))
    .limit(4);
  return { ...item, relatedItems: related.map(serializeItem) };
}

async function replaceChildren(
  tx: ReturnType<typeof getDb>,
  user: AuthUser,
  itemId: string,
  input: ResearchItemInput,
) {
  await tx.delete(researchSources).where(eq(researchSources.researchItemId, itemId));
  await tx
    .delete(researchItemOrganizations)
    .where(eq(researchItemOrganizations.researchItemId, itemId));
  await tx.insert(researchSources).values(
    input.sources.map((source) => ({
      researchItemId: itemId,
      sourceType: source.sourceType,
      title: source.title,
      url: source.url ?? null,
      filePath: source.filePath ?? null,
      publisher: source.publisher ?? null,
      publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
      pageNumber: source.pageNumber ?? null,
      quotedText: source.quotedText ?? null,
    })),
  );
  for (const organization of input.organizations) {
    const [existing] = await tx
      .select({ id: researchOrganizations.id })
      .from(researchOrganizations)
      .where(
        and(
          eq(researchOrganizations.organizationId, user.organizationId),
          eq(researchOrganizations.name, organization.name),
        ),
      )
      .limit(1);
    const organizationId = existing?.id ?? (
      await tx
        .insert(researchOrganizations)
        .values({
          organizationId: user.organizationId,
          name: organization.name,
          organizationType: (organization.organizationType ?? "OTHER") as never,
          country: organization.country ?? null,
          website: organization.website ?? null,
          description: organization.description ?? null,
        })
        .returning({ id: researchOrganizations.id })
    )[0].id;
    await tx.insert(researchItemOrganizations).values({
      researchItemId: itemId,
      researchOrganizationId: organizationId,
      relationship: organization.relationship ?? null,
    });
  }
}

function itemValues(user: AuthUser, input: ResearchItemInput) {
  return {
    dimension: input.dimension,
    subtype: input.subtype,
    title: input.title,
    summary: input.summary,
    whatHappened: input.whatHappened,
    whyItMatters: input.whyItMatters,
    cloudskyImplication: input.cloudskyImplication,
    recommendedAction: input.recommendedAction,
    eventDate: input.eventDate,
    importance: input.importance,
    confidence: input.confidence,
    status: input.status,
    ownerUserId: input.ownerUserId ?? user.id,
    nextAction: input.nextAction ?? null,
    nextFollowUpDate: input.nextFollowUpDate ?? null,
    details: input.details ?? {},
  };
}

export async function createResearchItem(user: AuthUser, input: ResearchItemInput) {
  if (!hasDatabase()) throw new Error("数据库未配置，无法保存研究条目。");
  const created = await getDb().transaction(async (tx) => {
    const [item] = await tx
      .insert(researchItems)
      .values({
        organizationId: user.organizationId,
        ...itemValues(user, input),
        createdBy: user.id,
      })
      .returning();
    await replaceChildren(tx, user, item.id, input);
    await tx.insert(researchItemVersions).values({
      researchItemId: item.id,
      versionNo: 1,
      snapshotJson: item,
      changeSummary: input.changeSummary ?? "创建研究条目",
      createdBy: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "RESEARCH_ITEM",
      resourceId: item.id,
      requestId: crypto.randomUUID(),
      afterJson: item,
      metadataJson: { title: item.title, dimension: item.dimension },
    });
    return item;
  });
  const record = await getResearchItem(user, created.id);
  if (!record) throw new Error("研究条目创建后无法读取。");
  return record;
}

export async function updateResearchItem(
  user: AuthUser,
  itemId: string,
  input: ResearchItemInput,
) {
  if (!hasDatabase()) throw new Error("数据库未配置，无法保存研究条目。");
  await getDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(researchItems)
      .where(
        and(
          eq(researchItems.id, itemId),
          eq(researchItems.organizationId, user.organizationId),
        ),
      )
      .limit(1);
    if (!current) throw new Error("未找到研究条目。");
    const versionNo = current.currentVersionNo + 1;
    const [updated] = await tx
      .update(researchItems)
      .set({
        ...itemValues(user, input),
        currentVersionNo: versionNo,
        reviewedBy: input.status === "REVIEWED" ? user.id : current.reviewedBy,
        reviewedAt: input.status === "REVIEWED" ? new Date() : current.reviewedAt,
        updatedAt: new Date(),
      })
      .where(eq(researchItems.id, itemId))
      .returning();
    await replaceChildren(tx, user, itemId, input);
    await tx.insert(researchItemVersions).values({
      researchItemId: itemId,
      versionNo,
      snapshotJson: updated,
      changeSummary: input.changeSummary ?? "更新研究条目",
      createdBy: user.id,
    });
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "UPDATE",
      resourceType: "RESEARCH_ITEM",
      resourceId: itemId,
      requestId: crypto.randomUUID(),
      beforeJson: current,
      afterJson: updated,
      metadataJson: { title: updated.title, dimension: updated.dimension },
    });
  });
  const record = await getResearchItem(user, itemId);
  if (!record) throw new Error("更新后的研究条目无法读取。");
  return record;
}
