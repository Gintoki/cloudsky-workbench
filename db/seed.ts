import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
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
  researchIndustryModules,
  researchItemOrganizations,
  researchItems,
  researchItemVersions,
  researchOrganizations,
  researchSources,
  rolePermissions,
  roles,
  sources,
  userRoles,
  users,
} from "./schema";
import {
  methodologyFacts,
  methodologySource,
} from "../lib/company-research/methodology";
import { industryModuleDefinitions } from "../lib/company-research/industry-modules";
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
import { researchKnowledgeSeeds } from "../lib/research-knowledge/seed-data";

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
  "research.read",
  "research.create",
  "research.update",
  "research.submit",
  "research.approve",
  "audit.read",
  "users.manage",
  "roles.manage",
  "settings.manage",
  "investor.read",
  "investor.create",
  "investor.update",
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
  for (const code of permissionCodes) {
    const [resource, action = "*"] =
      code === "*" ? ["*", "*"] : code.split(".");
    const [existingPermission] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.code, code))
      .limit(1);
    if (existingPermission) {
      await db
        .update(permissions)
        .set({ resource, action, description: code, updatedAt: new Date() })
        .where(eq(permissions.id, existingPermission.id));
      permissionIdByCode.set(code, existingPermission.id);
      continue;
    }
    const [permission] = await db
      .insert(permissions)
      .values({ id: crypto.randomUUID(), code, resource, action, description: code })
      .returning({ id: permissions.id });
    permissionIdByCode.set(code, permission.id);
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

  for (const definition of industryModuleDefinitions) {
    await db
      .insert(researchIndustryModules)
      .values({
        code: definition.code,
        name: definition.name,
        description: definition.description,
        definitionJson: { metrics: definition.metrics },
      })
      .onConflictDoUpdate({
        target: researchIndustryModules.code,
        set: {
          name: definition.name,
          description: definition.description,
          definitionJson: { metrics: definition.metrics },
          isActive: true,
          updatedAt: new Date(),
        },
      });
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

  const methodologySourceId = "30000000-0000-4000-8000-000000000002";
  await db
    .insert(sources)
    .values({
      id: methodologySourceId,
      organizationId: DEMO_ORGANIZATION_ID,
      sourceType: methodologySource.sourceType,
      title: methodologySource.title,
      publisher: methodologySource.publisher,
      accessedAt: new Date(),
    })
    .onConflictDoNothing();
  for (const [index, methodologyFact] of methodologyFacts.entries()) {
    const id = `11000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    await db
      .insert(companyFacts)
      .values({
        id,
        organizationId: DEMO_ORGANIZATION_ID,
        primaryCategory: "公司研究方法论",
        secondaryCategory: methodologyFact.secondaryCategory,
        title: methodologyFact.title,
        content: methodologyFact.content,
        measurementBasis: "根据用户提供的《投资方法框架》提炼的通用研究原则，不包含案例公司数据。",
        ownerUserId: demoUsers[1].id,
        status: "APPROVED",
        reviewerUserId: demoUsers[1].id,
        reviewedAt: new Date(),
        effectiveDate: new Date(),
        currentVersionNo: 1,
        createdBy: demoUsers[1].id,
        updatedBy: demoUsers[1].id,
      })
      .onConflictDoNothing();
    await db
      .insert(factSources)
      .values({
        factId: id,
        sourceId: methodologySourceId,
        sourceQuote: methodologySource.locator,
        isPrimary: true,
      })
      .onConflictDoNothing();
    await db
      .insert(factVersions)
      .values({
        factId: id,
        versionNo: 1,
        snapshotJson: methodologyFact,
        changeSummary: "导入公司研究方法论",
        status: "APPROVED",
        createdBy: demoUsers[1].id,
      })
      .onConflictDoNothing();
  }

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

  for (const seedItem of researchKnowledgeSeeds) {
    await db
      .insert(researchOrganizations)
      .values({
        id: seedItem.organizationId,
        organizationId: DEMO_ORGANIZATION_ID,
        name: seedItem.organizations[0].name,
        organizationType: "COMPANY",
      })
      .onConflictDoNothing();
    await db
      .insert(researchItems)
      .values({
        id: seedItem.id,
        organizationId: DEMO_ORGANIZATION_ID,
        dimension: seedItem.dimension,
        subtype: seedItem.subtype,
        title: seedItem.title,
        summary: seedItem.summary,
        whatHappened: seedItem.whatHappened,
        whyItMatters: seedItem.whyItMatters,
        cloudskyImplication: seedItem.cloudskyImplication,
        recommendedAction: seedItem.recommendedAction,
        eventDate: seedItem.eventDate,
        importance: seedItem.importance,
        confidence: seedItem.confidence,
        status: seedItem.status,
        ownerUserId: demoUsers[1].id,
        nextAction: seedItem.nextAction,
        details: seedItem.details,
        createdBy: demoUsers[1].id,
        reviewedBy: demoUsers[1].id,
        reviewedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: researchItems.id,
        set: {
          nextFollowUpDate: sql`coalesce(${researchItems.nextFollowUpDate}, excluded.next_follow_up_date)`,
        },
      });
    await db
      .insert(researchSources)
      .values({
        id: seedItem.sourceId,
        researchItemId: seedItem.id,
        sourceType: seedItem.sources[0].sourceType,
        title: seedItem.sources[0].title,
        url: seedItem.sources[0].url,
        publisher: seedItem.sources[0].publisher,
      })
      .onConflictDoNothing();
    await db
      .insert(researchItemOrganizations)
      .values({
        researchItemId: seedItem.id,
        researchOrganizationId: seedItem.organizationId,
        relationship: seedItem.organizations[0].relationship,
      })
      .onConflictDoNothing();
    await db
      .insert(researchItemVersions)
      .values({
        id: seedItem.versionId,
        researchItemId: seedItem.id,
        versionNo: 1,
        snapshotJson: seedItem,
        changeSummary: seedItem.changeSummary ?? "初始化公开商业模式案例",
        createdBy: demoUsers[1].id,
      })
      .onConflictDoNothing();
  }

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
