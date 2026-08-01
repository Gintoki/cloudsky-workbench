import { and, eq, isNull } from "drizzle-orm";
import { closeDb, getDb } from "../db/client";
import {
  companyFacts,
  factSources,
  factVersions,
  researchIndustryModules,
  sources,
  users,
} from "../db/schema";
import { industryModuleDefinitions } from "../lib/company-research/industry-modules";
import { methodologyFacts, methodologySource } from "../lib/company-research/methodology";

const [organizationId, userId] = process.argv.slice(2);

if (!organizationId || !userId) {
  throw new Error(
    "Usage: npm run db:import-methodology -- <organizationId> <userId>",
  );
}

async function importMethodology() {
  const db = getDb();
  const [owner] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.organizationId, organizationId),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!owner) throw new Error("The supplied user does not belong to the organization.");

  await db.transaction(async (tx) => {
    for (const definition of industryModuleDefinitions) {
      await tx
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

    const [existingSource] = await tx
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.organizationId, organizationId),
          eq(sources.sourceType, methodologySource.sourceType),
          eq(sources.title, methodologySource.title),
          isNull(sources.deletedAt),
        ),
      )
      .limit(1);
    const source =
      existingSource ??
      (
        await tx
          .insert(sources)
          .values({
            organizationId,
            sourceType: methodologySource.sourceType,
            title: methodologySource.title,
            publisher: methodologySource.publisher,
            accessedAt: new Date(),
          })
          .returning()
      )[0];

    for (const methodologyFact of methodologyFacts) {
      const [existingFact] = await tx
        .select()
        .from(companyFacts)
        .where(
          and(
            eq(companyFacts.organizationId, organizationId),
            eq(companyFacts.primaryCategory, "公司研究方法论"),
            eq(companyFacts.title, methodologyFact.title),
            isNull(companyFacts.deletedAt),
          ),
        )
        .limit(1);
      if (existingFact) continue;
      const [fact] = await tx
        .insert(companyFacts)
        .values({
          organizationId,
          primaryCategory: "公司研究方法论",
          secondaryCategory: methodologyFact.secondaryCategory,
          title: methodologyFact.title,
          content: methodologyFact.content,
          measurementBasis:
            "根据用户提供的《投资方法框架》提炼的通用研究原则，不包含案例公司数据。",
          ownerUserId: userId,
          status: "APPROVED",
          reviewerUserId: userId,
          reviewedAt: new Date(),
          effectiveDate: new Date(),
          currentVersionNo: 1,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();
      await tx.insert(factSources).values({
        factId: fact.id,
        sourceId: source.id,
        sourceQuote: methodologySource.locator,
        isPrimary: true,
      });
      await tx.insert(factVersions).values({
        factId: fact.id,
        versionNo: 1,
        snapshotJson: methodologyFact,
        changeSummary: "导入公司研究方法论",
        status: "APPROVED",
        createdBy: userId,
      });
    }
  });
}

importMethodology()
  .then(async () => {
    console.log("Company research methodology imported.");
    await closeDb();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exitCode = 1;
  });
