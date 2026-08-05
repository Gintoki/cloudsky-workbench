import { createResearchItem } from "@/lib/research-knowledge/repository";
import type { ResearchDimension, ResearchItemInput } from "@/lib/research-knowledge/types";
import type { AuthUser } from "@/lib/auth/types";
import {
  getAgentAnswerForWriteback,
  recordAgentWriteback,
} from "./repository";

const defaultSubtype: Record<ResearchDimension, string> = {
  MARKET: "PRODUCT_AND_INDUSTRY_EVENT",
  TECHNOLOGY: "TECH_VALIDATION",
  BUSINESS_MODEL: "CLOUDSKY_MODEL_DESIGN",
};

function clip(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

export async function writeAgentAnswerToResearch(
  user: AuthUser,
  input: { conversationId: string; messageId: string; dimension: ResearchDimension },
) {
  const record = await getAgentAnswerForWriteback(user, input.conversationId, input.messageId);
  if (!record) throw new Error("此回答不存在、无权访问，或已经写入研究知识库。");

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
  }).format(new Date());
  const citations = record.message.citations;
  if (!citations.length) {
    throw new Error("该回答没有可追溯的内部引用，不能写入研究知识库。");
  }
  const draft: ResearchItemInput = {
    dimension: input.dimension,
    subtype: defaultSubtype[input.dimension],
    title: `AI 问答草稿：${clip(record.question || record.conversation.title, 72)}`,
    summary: clip(record.message.content, 1_600),
    whatHappened: record.message.content,
    whyItMatters: "该内容由 Research Agent 基于下列已授权内部资料整理，需在发布前逐项核验。",
    cloudskyImplication: "待负责人结合业务背景确认，不作为自动结论。",
    recommendedAction: "核验引用来源、补充必要的原始证据后，再决定是否提交审核。",
    eventDate: today,
    importance: "MEDIUM",
    confidence: "LOW",
    status: "INBOX",
    ownerUserId: user.id,
    nextAction: "人工核验 AI 问答草稿及其引用。",
    details: {
      provenance: "RESEARCH_AGENT_DRAFT",
      conversationId: record.conversation.id,
      messageId: record.message.id,
      generatedAt: record.message.createdAt,
      note: "AI 生成的待审核草稿，不可视为已核实事实。",
    },
    organizations: [],
    sources: citations.map((citation) => ({
      sourceType: "INTERNAL_RAG_REFERENCE",
      title: citation.title,
      url: citation.href,
      publishedAt: citation.updatedAt ?? null,
      quotedText: citation.excerpt,
    })),
    changeSummary: "由 Research Agent 问答写入的待审核草稿",
  };
  const researchItem = await createResearchItem(user, draft);
  await recordAgentWriteback(user, record.conversation.id, record.message.id, researchItem.id);
  return researchItem;
}
