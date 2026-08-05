import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import {
  agentConversations,
  agentMessages,
  agentWritebacks,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth/types";

export type AgentCitation = {
  id: string;
  type: string;
  title: string;
  href: string;
  updatedAt?: string | null;
  excerpt: string;
};

export type AgentMessageRecord = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: AgentCitation[];
  model: string | null;
  createdAt: string;
  writebackResearchItemId: string | null;
};

export type AgentConversationRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: AgentMessageRecord[];
};

function conversationScope(user: AuthUser) {
  return and(
    eq(agentConversations.organizationId, user.organizationId),
    eq(agentConversations.userId, user.id),
  );
}

function parseCitations(value: unknown): AgentCitation[] {
  return Array.isArray(value) ? value.filter((item): item is AgentCitation =>
    Boolean(item) && typeof item === "object" && "id" in item && "title" in item && "href" in item,
  ) : [];
}

function serializeConversation(row: typeof agentConversations.$inferSelect): AgentConversationRecord {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAgentConversations(user: AuthUser): Promise<AgentConversationRecord[]> {
  if (!hasDatabase()) return [];
  const rows = await getDb()
    .select()
    .from(agentConversations)
    .where(conversationScope(user))
    .orderBy(desc(agentConversations.updatedAt))
    .limit(50);
  return rows.map(serializeConversation);
}

export async function getAgentConversation(
  user: AuthUser,
  conversationId: string,
): Promise<AgentConversationRecord | null> {
  if (!hasDatabase()) return null;
  const db = getDb();
  const [conversation] = await db
    .select()
    .from(agentConversations)
    .where(and(conversationScope(user), eq(agentConversations.id, conversationId)))
    .limit(1);
  if (!conversation) return null;
  const messages = await db
    .select({
      id: agentMessages.id,
      role: agentMessages.role,
      content: agentMessages.content,
      citations: agentMessages.citations,
      model: agentMessages.model,
      createdAt: agentMessages.createdAt,
      writebackResearchItemId: agentWritebacks.researchItemId,
    })
    .from(agentMessages)
    .leftJoin(agentWritebacks, eq(agentWritebacks.messageId, agentMessages.id))
    .where(eq(agentMessages.conversationId, conversation.id))
    .orderBy(asc(agentMessages.createdAt));
  return {
    ...serializeConversation(conversation),
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      citations: parseCitations(message.citations),
      model: message.model,
      createdAt: message.createdAt.toISOString(),
      writebackResearchItemId: message.writebackResearchItemId,
    })),
  };
}

function titleFromQuestion(question: string) {
  return question.replace(/\s+/g, " ").slice(0, 72);
}

export async function saveAgentExchange(
  user: AuthUser,
  input: {
    conversationId?: string;
    question: string;
    answer: string;
    citations: AgentCitation[];
    model: string;
  },
) {
  if (!hasDatabase()) throw new Error("数据库未配置，无法保存问答历史。");
  const db = getDb();
  const saved = await db.transaction(async (tx) => {
    let conversationId = input.conversationId;
    if (conversationId) {
      const [existing] = await tx
        .select({ id: agentConversations.id })
        .from(agentConversations)
        .where(and(conversationScope(user), eq(agentConversations.id, conversationId)))
        .limit(1);
      if (!existing) throw new Error("未找到此个人问答会话。");
    } else {
      const [created] = await tx
        .insert(agentConversations)
        .values({
          organizationId: user.organizationId,
          userId: user.id,
          title: titleFromQuestion(input.question),
        })
        .returning({ id: agentConversations.id });
      conversationId = created.id;
    }
    const [question] = await tx
      .insert(agentMessages)
      .values({
        conversationId,
        role: "USER",
        content: input.question,
        citations: [],
      })
      .returning({ id: agentMessages.id });
    const [answer] = await tx
      .insert(agentMessages)
      .values({
        conversationId,
        role: "ASSISTANT",
        content: input.answer,
        citations: input.citations,
        model: input.model,
      })
      .returning({ id: agentMessages.id });
    await tx
      .update(agentConversations)
      .set({ updatedAt: new Date() })
      .where(eq(agentConversations.id, conversationId));
    return { conversationId, questionMessageId: question.id, answerMessageId: answer.id };
  });
  return getAgentConversation(user, saved.conversationId);
}

export async function getAgentAnswerForWriteback(
  user: AuthUser,
  conversationId: string,
  messageId: string,
) {
  const conversation = await getAgentConversation(user, conversationId);
  if (!conversation?.messages) return null;
  const message = conversation.messages.find(
    (item) => item.id === messageId && item.role === "ASSISTANT",
  );
  if (!message || message.writebackResearchItemId) return null;
  const question = [...conversation.messages]
    .slice(0, conversation.messages.findIndex((item) => item.id === messageId))
    .reverse()
    .find((item) => item.role === "USER");
  return { conversation, message, question: question?.content ?? "" };
}

export async function recordAgentWriteback(
  user: AuthUser,
  conversationId: string,
  messageId: string,
  researchItemId: string,
) {
  if (!hasDatabase()) throw new Error("数据库未配置，无法记录研究写入。");
  await getDb().insert(agentWritebacks).values({
    organizationId: user.organizationId,
    conversationId,
    messageId,
    researchItemId,
    createdBy: user.id,
  });
}
