import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "./client";
import {
  auditLogs,
  companies,
  companyFacts,
  factSources,
  factVersions,
  industries,
  intelligenceItemCompanies,
  intelligenceItems,
  metricValues,
  metrics,
  organizations,
  permissions,
  rolePermissions,
  roles,
  sources,
  userRoles,
  users,
} from "./schema";
import {
  DEMO_ORGANIZATION_ID,
  DEMO_PASSWORD,
  demoUsers,
} from "../lib/auth/demo-users";
import { permissionsForRole } from "../lib/auth/permissions";
import type { PermissionCode, RoleCode } from "../lib/auth/types";
import {
  industrySeeds,
  intelligenceCompanySeeds,
  intelligenceItemSeeds,
  notionIndustryFetchedAt,
  notionIndustryRadarUrl,
} from "../lib/intelligence/notion-industry-radar";

const roleIds: Record<RoleCode, string> = {
  ADMINISTRATOR: "00000000-0000-4000-8000-000000000201",
  DIRECTOR: "00000000-0000-4000-8000-000000000202",
  ANALYST: "00000000-0000-4000-8000-000000000203",
  VIEWER: "00000000-0000-4000-8000-000000000204",
};

const permissionCodes: PermissionCode[] = [
  "*",
  "dashboard.read",
  "facts.read",
  "facts.create",
  "facts.update",
  "facts.submit",
  "facts.approve",
  "metrics.read",
  "metrics.create",
  "metrics.update",
  "metrics.approve",
  "intelligence.read",
  "intelligence.create",
  "intelligence.update",
  "audit.read",
  "users.manage",
  "roles.manage",
  "settings.manage",
];

async function seed() {
  const db = getDb();
  await db
    .insert(organizations)
    .values({
      id: DEMO_ORGANIZATION_ID,
      name: "云天畅想（Demo 环境）",
      slug: "cloudsky-demo",
    })
    .onConflictDoNothing();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const user of demoUsers) {
    await db
      .insert(users)
      .values({
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        displayName: user.displayName,
        passwordHash,
        status: "ACTIVE",
        passwordChangedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [users.organizationId, users.email],
        set: { passwordHash, displayName: user.displayName, status: "ACTIVE" },
      });
  }

  for (const [role, id] of Object.entries(roleIds) as Array<
    [RoleCode, string]
  >) {
    await db
      .insert(roles)
      .values({
        id,
        organizationId: DEMO_ORGANIZATION_ID,
        code: role,
        name: role,
        description: `${role} default role`,
      })
      .onConflictDoNothing();
  }

  const permissionIdByCode = new Map<PermissionCode, string>();
  for (const [index, code] of permissionCodes.entries()) {
    const id = `00000000-0000-4000-8000-${String(300 + index).padStart(12, "0")}`;
    const [resource, action = "*"] =
      code === "*" ? ["*", "*"] : code.split(".");
    await db
      .insert(permissions)
      .values({ id, code, resource, action, description: code })
      .onConflictDoNothing();
    permissionIdByCode.set(code, id);
  }

  for (const user of demoUsers) {
    await db
      .insert(userRoles)
      .values({
        userId: user.id,
        roleId: roleIds[user.role],
        createdBy: demoUsers[0].id,
      })
      .onConflictDoNothing();
  }

  for (const role of Object.keys(roleIds) as RoleCode[]) {
    for (const permission of permissionsForRole(role)) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: roleIds[role],
          permissionId: permissionIdByCode.get(permission)!,
        })
        .onConflictDoNothing();
    }
  }

  const sourceId = "30000000-0000-4000-8000-000000000001";
  await db
    .insert(sources)
    .values({
      id: sourceId,
      organizationId: DEMO_ORGANIZATION_ID,
      sourceType: "DEMO",
      title: "Demo Source：产品验收说明",
      publisher: "CloudSky Workbench",
    })
    .onConflictDoNothing();

  const factId = "10000000-0000-4000-8000-000000000001";
  await db
    .insert(companyFacts)
    .values({
      id: factId,
      organizationId: DEMO_ORGANIZATION_ID,
      primaryCategory: "算力资源",
      secondaryCategory: "资源口径示例",
      title: "活跃 GPU 统计口径（Demo）",
      content:
        "演示记录：活跃 GPU 需满足已纳入资源池、健康检查通过且报告期内可调度。此内容不代表云天畅想真实口径或数据。",
      measurementBasis: "演示口径，仅用于产品验收",
      periodLabel: "2026 Q2（Demo）",
      ownerUserId: demoUsers[1].id,
      status: "APPROVED",
      reviewerUserId: demoUsers[1].id,
      reviewedAt: new Date(),
      effectiveDate: new Date(),
      currentVersionNo: 1,
      createdBy: demoUsers[2].id,
      updatedBy: demoUsers[1].id,
    })
    .onConflictDoNothing();
  await db
    .insert(factSources)
    .values({
      factId,
      sourceId,
      sourceQuote: "本记录为虚构示例，不得用于任何外部材料。",
      isPrimary: true,
    })
    .onConflictDoNothing();
  await db
    .insert(factVersions)
    .values({
      factId,
      versionNo: 1,
      snapshotJson: { demo: true, title: "活跃 GPU 统计口径（Demo）" },
      changeSummary: "创建 Demo 事实",
      status: "APPROVED",
      createdBy: demoUsers[1].id,
    })
    .onConflictDoNothing();

  const metricId = "21000000-0000-4000-8000-000000000001";
  const metricValueId = "20000000-0000-4000-8000-000000000001";
  await db
    .insert(metrics)
    .values({
      id: metricId,
      organizationId: DEMO_ORGANIZATION_ID,
      code: "DEMO_REVENUE",
      name: "营业收入（Demo）",
      defaultUnit: "百万元",
      measurementBasis: "虚构演示数据，不代表公司实际经营情况",
      ownerUserId: demoUsers[2].id,
    })
    .onConflictDoNothing();
  await db
    .insert(metricValues)
    .values({
      id: metricValueId,
      metricId,
      valueType: "ACTUAL",
      scenario: "BASE",
      frequency: "QUARTERLY",
      periodStart: "2026-04-01",
      periodEnd: "2026-06-30",
      periodLabel: "2026 Q2",
      valueNumeric: "138",
      unit: "百万元",
      measurementBasis: "虚构演示数据，不代表公司实际经营情况",
      status: "APPROVED",
      sourceId,
      ownerUserId: demoUsers[2].id,
      reviewerUserId: demoUsers[1].id,
      reviewedAt: new Date(),
      createdBy: demoUsers[2].id,
      updatedBy: demoUsers[1].id,
    })
    .onConflictDoNothing();

  await db.transaction(async (tx) => {
    const industryBySlug = new Map(
      industrySeeds.map((industry) => [industry.slug, industry]),
    );
    const companyByName = new Map(
      intelligenceCompanySeeds.map((company) => [company.name, company]),
    );
    for (const industry of industrySeeds) {
      await tx
        .insert(industries)
        .values({
          id: industry.id,
          name: industry.name,
          slug: industry.slug,
          description: industry.description,
          notionPageUrl: industry.notionPageUrl,
        })
        .onConflictDoUpdate({
          target: industries.slug,
          set: {
            name: industry.name,
            description: industry.description,
            notionPageUrl: industry.notionPageUrl,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });
    }
    for (const company of intelligenceCompanySeeds) {
      const industry = industryBySlug.get(company.categorySlug);
      if (!industry) throw new Error(`Unknown industry: ${company.categorySlug}`);
      await tx
        .insert(companies)
        .values({
          id: company.id,
          organizationId: DEMO_ORGANIZATION_ID,
          name: company.name,
          industry: industry.name,
          entityType: company.entityType,
          observationScope: company.observationScope,
          notionPageUrl: company.notionPageUrl,
          ownerUserId: demoUsers[1].id,
        })
        .onConflictDoUpdate({
          target: [companies.organizationId, companies.name],
          set: {
            industry: industry.name,
            entityType: company.entityType,
            observationScope: company.observationScope,
            notionPageUrl: company.notionPageUrl,
            ownerUserId: demoUsers[1].id,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });
    }
    for (const intelligence of intelligenceItemSeeds) {
      const industry = industryBySlug.get(intelligence.categorySlug);
      if (!industry) {
        throw new Error(`Unknown industry: ${intelligence.categorySlug}`);
      }
      const intelligenceSourceId = intelligence.id.replace(
        /^42/,
        "43",
      );
      await tx
        .insert(sources)
        .values({
          id: intelligenceSourceId,
          organizationId: DEMO_ORGANIZATION_ID,
          sourceType: "NOTION",
          title: `Notion 行业雷达 · ${intelligence.companyNames[0]}`,
          publisher: "Ricky's Knowledge Base",
          url: intelligence.notionPageUrl,
          accessedAt: new Date(notionIndustryFetchedAt),
        })
        .onConflictDoUpdate({
          target: sources.id,
          set: {
            title: `Notion 行业雷达 · ${intelligence.companyNames[0]}`,
            publisher: "Ricky's Knowledge Base",
            url: intelligence.notionPageUrl,
            accessedAt: new Date(notionIndustryFetchedAt),
            deletedAt: null,
            updatedAt: new Date(),
          },
        });
      await tx
        .insert(intelligenceItems)
        .values({
          id: intelligence.id,
          organizationId: DEMO_ORGANIZATION_ID,
          industryId: industry.id,
          sourceId: intelligenceSourceId,
          title: intelligence.title,
          summary: intelligence.summary,
          details: intelligence.details,
          originalUrl:
            intelligence.sourceLinks[0]?.url ?? intelligence.notionPageUrl,
          notionPageUrl: intelligence.notionPageUrl,
          sourceNote: intelligence.sourceNote,
          sourceLinks: intelligence.sourceLinks,
          publishedAt: new Date(`${intelligence.publishedAt}T00:00:00.000Z`),
          fetchedAt: new Date(notionIndustryFetchedAt),
          eventType: intelligence.eventType,
          importance: 0,
          relationshipToCloudsky: intelligence.relationshipToCloudsky,
          tags: intelligence.tags,
          status: "APPROVED",
          ownerUserId: demoUsers[1].id,
          reviewerUserId: demoUsers[1].id,
          reviewedAt: new Date(notionIndustryFetchedAt),
        })
        .onConflictDoUpdate({
          target: intelligenceItems.id,
          set: {
            industryId: industry.id,
            sourceId: intelligenceSourceId,
            title: intelligence.title,
            summary: intelligence.summary,
            details: intelligence.details,
            originalUrl:
              intelligence.sourceLinks[0]?.url ?? intelligence.notionPageUrl,
            notionPageUrl: intelligence.notionPageUrl,
            sourceNote: intelligence.sourceNote,
            sourceLinks: intelligence.sourceLinks,
            publishedAt: new Date(
              `${intelligence.publishedAt}T00:00:00.000Z`,
            ),
            fetchedAt: new Date(notionIndustryFetchedAt),
            eventType: intelligence.eventType,
            relationshipToCloudsky: intelligence.relationshipToCloudsky,
            tags: intelligence.tags,
            status: "APPROVED",
            ownerUserId: demoUsers[1].id,
            reviewerUserId: demoUsers[1].id,
            reviewedAt: new Date(notionIndustryFetchedAt),
            deletedAt: null,
            updatedAt: new Date(),
          },
        });
      for (const companyName of intelligence.companyNames) {
        const company = companyByName.get(companyName);
        if (!company) {
          throw new Error(`Unknown intelligence entity: ${companyName}`);
        }
        await tx
          .insert(intelligenceItemCompanies)
          .values({
            intelligenceItemId: intelligence.id,
            companyId: company.id,
          })
          .onConflictDoNothing();
      }
    }
    const existingIntelligenceAudit = await tx
      .select({ id: auditLogs.id })
      .from(auditLogs)
      .where(eq(auditLogs.requestId, "req_seed_notion_industry_radar"))
      .limit(1);
    if (!existingIntelligenceAudit.length) {
      await tx.insert(auditLogs).values({
        organizationId: DEMO_ORGANIZATION_ID,
        actorUserId: demoUsers[1].id,
        action: "IMPORT",
        resourceType: "INTELLIGENCE_ITEM",
        requestId: "req_seed_notion_industry_radar",
        afterJson: {
          categories: industrySeeds.length,
          entities: intelligenceCompanySeeds.length,
          items: intelligenceItemSeeds.length,
        },
        metadataJson: {
          title: "导入 Notion 行业雷达",
          source: notionIndustryRadarUrl,
        },
      });
    }
  });

  const existingAudit = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(eq(auditLogs.requestId, "req_seed_demo"))
    .limit(1);
  if (!existingAudit.length) {
    await db.insert(auditLogs).values({
      organizationId: DEMO_ORGANIZATION_ID,
      actorUserId: demoUsers[0].id,
      action: "SEED_DEMO",
      resourceType: "SYSTEM",
      requestId: "req_seed_demo",
      metadataJson: {
        title: "初始化 Demo 数据",
        warning: "Not real CloudSky data",
      },
    });
  }
}

seed()
  .then(async () => {
    console.log("Demo seed completed.");
    await closeDb();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
  });
