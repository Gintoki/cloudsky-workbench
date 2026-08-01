import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import {
  auditLogs,
  investorAccounts,
  investorContacts,
  roadshowRecords,
  roadshowTranscriptSegments,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth/types";
import type {
  InvestorAccountRecord,
  InvestorContactRecord,
  InvestorCrmData,
  RoadshowListData,
  RoadshowRecord,
} from "./types";
import type { z } from "zod";
import {
  investorAccountSchema,
  investorContactSchema,
  roadshowRecordSchema,
} from "./validation";
import {
  canUseVisibilityWithinAccount,
  isInvestorManagementRole,
} from "./visibility";

type InvestorAccountInput = z.infer<typeof investorAccountSchema>;
type InvestorContactInput = z.infer<typeof investorContactSchema>;
type RoadshowRecordInput = z.infer<typeof roadshowRecordSchema>;

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function dateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

function visibleInvestorAccountPredicate(user: AuthUser) {
  const ownerAccess = and(
    eq(investorAccounts.ownerUserId, user.id),
    or(
      eq(investorAccounts.visibility, "PRIVATE"),
      eq(investorAccounts.visibility, "MANAGEMENT"),
    ),
  );
  return isInvestorManagementRole(user.role)
    ? or(
        eq(investorAccounts.visibility, "TEAM"),
        eq(investorAccounts.visibility, "MANAGEMENT"),
        ownerAccess,
      )
    : or(eq(investorAccounts.visibility, "TEAM"), ownerAccess);
}

function visibleRoadshowPredicate(user: AuthUser) {
  const ownerAccess = and(
    eq(roadshowRecords.ownerUserId, user.id),
    or(
      eq(roadshowRecords.visibility, "PRIVATE"),
      eq(roadshowRecords.visibility, "MANAGEMENT"),
    ),
  );
  return isInvestorManagementRole(user.role)
    ? or(
        eq(roadshowRecords.visibility, "TEAM"),
        eq(roadshowRecords.visibility, "MANAGEMENT"),
        ownerAccess,
      )
    : or(eq(roadshowRecords.visibility, "TEAM"), ownerAccess);
}

function contactRecord(contact: typeof investorContacts.$inferSelect): InvestorContactRecord {
  return {
    id: contact.id,
    name: contact.name,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    wechat: contact.wechat,
    isPrimary: contact.isPrimary,
  };
}

function accountRecord(
  account: typeof investorAccounts.$inferSelect,
  contacts: typeof investorContacts.$inferSelect[],
  roadshows: typeof roadshowRecords.$inferSelect[],
): InvestorAccountRecord {
  const latestRoadshow = roadshows.reduce<Date | null>((latest, item) => {
    if (!latest || item.occurredAt > latest) return item.occurredAt;
    return latest;
  }, null);
  return {
    id: account.id,
    name: account.name,
    investorType: account.investorType,
    relationshipStage: account.relationshipStage,
    focus: account.focus,
    geography: account.geography,
    website: account.website,
    notes: account.notes,
    visibility: account.visibility,
    nextAction: account.nextAction,
    nextActionAt: dateValue(account.nextActionAt),
    lastInteractionAt: iso(account.lastInteractionAt),
    contacts: contacts
      .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
      .map(contactRecord),
    roadshowCount: roadshows.length,
    latestRoadshowAt: iso(latestRoadshow),
  };
}

async function assertAccount(user: AuthUser, accountId: string) {
  const [account] = await getDb()
    .select()
    .from(investorAccounts)
    .where(
      and(
        eq(investorAccounts.id, accountId),
        eq(investorAccounts.organizationId, user.organizationId),
        isNull(investorAccounts.deletedAt),
        visibleInvestorAccountPredicate(user),
      ),
    )
    .limit(1);
  if (!account) throw new Error("投资人机构不存在或已不可用。");
  return account;
}

export async function listInvestorCrm(user: AuthUser): Promise<InvestorCrmData> {
  if (!hasDatabase()) return { databaseAvailable: false, accounts: [] };
  const db = getDb();
  const accounts = await db
    .select()
    .from(investorAccounts)
    .where(
      and(
        eq(investorAccounts.organizationId, user.organizationId),
        isNull(investorAccounts.deletedAt),
        visibleInvestorAccountPredicate(user),
      ),
    )
    .orderBy(desc(investorAccounts.lastInteractionAt), asc(investorAccounts.name));
  if (!accounts.length) return { databaseAvailable: true, accounts: [] };

  const accountIds = accounts.map((account) => account.id);
  const [contacts, roadshows] = await Promise.all([
    db.select().from(investorContacts).where(inArray(investorContacts.investorAccountId, accountIds)),
    db
      .select()
      .from(roadshowRecords)
      .where(
        and(
          inArray(roadshowRecords.investorAccountId, accountIds),
          visibleRoadshowPredicate(user),
        ),
      ),
  ]);
  return {
    databaseAvailable: true,
    accounts: accounts.map((account) =>
      accountRecord(
        account,
        contacts.filter((contact) => contact.investorAccountId === account.id),
        roadshows.filter((roadshow) => roadshow.investorAccountId === account.id),
      ),
    ),
  };
}

export async function createInvestorAccount(user: AuthUser, input: InvestorAccountInput) {
  const db = getDb();
  const requestId = crypto.randomUUID();
  return db.transaction(async (tx) => {
    const [account] = await tx
      .insert(investorAccounts)
      .values({
        organizationId: user.organizationId,
        name: input.name,
        investorType: input.investorType,
        relationshipStage: input.relationshipStage,
        focus: input.focus,
        geography: input.geography,
        website: input.website,
        notes: input.notes,
        visibility: input.visibility,
        nextAction: input.nextAction,
        nextActionAt: input.nextActionAt,
        ownerUserId: user.id,
      })
      .returning();
    const contacts: typeof investorContacts.$inferSelect[] = [];
    if (input.primaryContact) {
      const [contact] = await tx
        .insert(investorContacts)
        .values({
          organizationId: user.organizationId,
          investorAccountId: account.id,
          ...input.primaryContact,
          isPrimary: true,
        })
        .returning();
      contacts.push(contact);
    }
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "INVESTOR_ACCOUNT",
      resourceId: account.id,
      requestId,
      afterJson: {
        name: account.name,
        relationshipStage: account.relationshipStage,
        visibility: account.visibility,
      },
      metadataJson: {
        title: account.name,
        visibility: account.visibility,
        ownerUserId: account.ownerUserId,
      },
    });
    return accountRecord(account, contacts, []);
  });
}

export async function createInvestorContact(
  user: AuthUser,
  accountId: string,
  input: InvestorContactInput,
) {
  const db = getDb();
  const account = await assertAccount(user, accountId);
  return db.transaction(async (tx) => {
    if (input.isPrimary) {
      await tx
        .update(investorContacts)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(investorContacts.investorAccountId, accountId));
    }
    const [contact] = await tx
      .insert(investorContacts)
      .values({
        organizationId: user.organizationId,
        investorAccountId: accountId,
        ...input,
      })
      .returning();
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "INVESTOR_CONTACT",
      resourceId: contact.id,
      requestId: crypto.randomUUID(),
      afterJson: { investorAccountId: accountId, name: contact.name },
      metadataJson: {
        title: contact.name,
        visibility: account.visibility,
        ownerUserId: account.ownerUserId,
      },
    });
    return contactRecord(contact);
  });
}

function roadshowRecord(
  row: typeof roadshowRecords.$inferSelect,
  investorAccountName: string,
  segments: typeof roadshowTranscriptSegments.$inferSelect[],
): RoadshowRecord {
  return {
    id: row.id,
    investorAccountId: row.investorAccountId,
    investorAccountName,
    investorContactId: row.investorContactId,
    title: row.title,
    format: row.format,
    occurredAt: row.occurredAt.toISOString(),
    durationSeconds: row.durationSeconds,
    audioUrl: row.audioUrl,
    transcript: row.transcript,
    keyTakeaways: row.keyTakeaways,
    nextAction: row.nextAction,
    followUpDueAt: dateValue(row.followUpDueAt),
    visibility: row.visibility,
    segments: segments
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((segment) => ({
        id: segment.id,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        speaker: segment.speaker,
        content: segment.content,
      })),
  };
}

export async function listRoadshows(user: AuthUser): Promise<RoadshowListData> {
  if (!hasDatabase()) return { databaseAvailable: false, records: [] };
  const db = getDb();
  const rows = await db
    .select({ record: roadshowRecords, accountName: investorAccounts.name })
    .from(roadshowRecords)
    .innerJoin(investorAccounts, eq(roadshowRecords.investorAccountId, investorAccounts.id))
    .where(
      and(
        eq(roadshowRecords.organizationId, user.organizationId),
        isNull(investorAccounts.deletedAt),
        visibleInvestorAccountPredicate(user),
        visibleRoadshowPredicate(user),
      ),
    )
    .orderBy(desc(roadshowRecords.occurredAt));
  if (!rows.length) return { databaseAvailable: true, records: [] };
  const segments = await db
    .select()
    .from(roadshowTranscriptSegments)
    .where(inArray(roadshowTranscriptSegments.roadshowRecordId, rows.map((row) => row.record.id)))
    .orderBy(asc(roadshowTranscriptSegments.sortOrder));
  return {
    databaseAvailable: true,
    records: rows.map((row) =>
      roadshowRecord(
        row.record,
        row.accountName,
        segments.filter((segment) => segment.roadshowRecordId === row.record.id),
      ),
    ),
  };
}

export async function createRoadshowRecord(user: AuthUser, input: RoadshowRecordInput) {
  const db = getDb();
  const account = await assertAccount(user, input.investorAccountId);
  if (!canUseVisibilityWithinAccount(input.visibility, account.visibility)) {
    throw new Error("路演记录的可见范围不能宽于所属投资人机构。");
  }
  if (input.investorContactId) {
    const [contact] = await db
      .select({ id: investorContacts.id })
      .from(investorContacts)
      .where(
        and(
          eq(investorContacts.id, input.investorContactId),
          eq(investorContacts.investorAccountId, account.id),
          eq(investorContacts.organizationId, user.organizationId),
        ),
      )
      .limit(1);
    if (!contact) throw new Error("联系人不属于所选投资人机构。");
  }
  return db.transaction(async (tx) => {
    const [record] = await tx
      .insert(roadshowRecords)
      .values({
        organizationId: user.organizationId,
        investorAccountId: account.id,
        investorContactId: input.investorContactId,
        title: input.title,
        format: input.format,
        occurredAt: input.occurredAt,
        durationSeconds: input.durationSeconds,
        audioUrl: input.audioUrl,
        transcript: input.transcript,
        keyTakeaways: input.keyTakeaways,
        nextAction: input.nextAction,
        followUpDueAt: input.followUpDueAt,
        ownerUserId: user.id,
        visibility: input.visibility,
      })
      .returning();
    const segments = input.segments.length
      ? await tx
          .insert(roadshowTranscriptSegments)
          .values(
            input.segments.map((segment, index) => ({
              roadshowRecordId: record.id,
              startSeconds: segment.startSeconds,
              endSeconds: segment.endSeconds,
              speaker: segment.speaker,
              content: segment.content,
              sortOrder: index,
            })),
          )
          .returning()
      : [];
    const update: Partial<typeof investorAccounts.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (!account.lastInteractionAt || input.occurredAt > account.lastInteractionAt) {
      update.lastInteractionAt = input.occurredAt;
    }
    if (input.nextAction !== undefined) update.nextAction = input.nextAction;
    if (input.followUpDueAt !== undefined) update.nextActionAt = input.followUpDueAt;
    await tx.update(investorAccounts).set(update).where(eq(investorAccounts.id, account.id));
    await tx.insert(auditLogs).values({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "CREATE",
      resourceType: "ROADSHOW_RECORD",
      resourceId: record.id,
      requestId: crypto.randomUUID(),
      afterJson: {
        investorAccountId: account.id,
        title: record.title,
        occurredAt: record.occurredAt.toISOString(),
        visibility: record.visibility,
      },
      metadataJson: {
        title: record.title,
        visibility: record.visibility,
        ownerUserId: record.ownerUserId,
      },
    });
    return roadshowRecord(record, account.name, segments);
  });
}
