import { getComparableMarketData } from "@/lib/market-data/comparables";
import { comparableUniverse } from "@/lib/market-data/coverage-universe";
import { getCompanyResearch, listCompanyResearch } from "@/lib/company-research/repository";
import { listIntelligence } from "@/lib/intelligence/repository";
import { listRoadshows } from "@/lib/investor-relations/repository";
import { listResearchItems } from "@/lib/research-knowledge/repository";
import type { AuthUser } from "@/lib/auth/types";
import type { AgentCitation } from "./repository";

const MAX_CONTEXT_CHARS = 11_000;
const MAX_SNIPPET_CHARS = 1_550;
const MAX_SOURCES = 8;
const requestWindows = new Map<string, number[]>();

export const agentModels = [
  { id: "qwen3.7-plus", label: "Qwen3.7 Plus", description: "日常研究问答", recommended: true },
  { id: "qwen3.8-max", label: "Qwen3.8 Max", description: "复杂研究与深度分析", recommended: false },
  { id: "qwen3.7-plus-2026-05-26", label: "Qwen3.7 Plus (2026-05-26)", description: "固定版本，便于结果复核", recommended: false },
] as const;

export type AgentModelId = (typeof agentModels)[number]["id"];
const agentModelIds = new Set<string>(agentModels.map((model) => model.id));

type KnowledgeSource = {
  id: string;
  type: "研究知识库" | "公司研究" | "行业动态" | "EAC 动态数据" | "投资人路演记录";
  title: string;
  href: string;
  content: string;
  updatedAt?: string | null;
};

export class AgentConfigurationError extends Error {}
export class AgentRateLimitError extends Error {}
export class AgentProviderError extends Error {}

function toText(parts: unknown[]) {
  return parts.flatMap((part) => {
    if (part === null || part === undefined || part === "") return [];
    return [typeof part === "object" ? JSON.stringify(part) : String(part)];
  }).join("\n");
}

function clip(value: string, length = MAX_SNIPPET_CHARS) {
  return value.length <= length ? value : `${value.slice(0, length)}…`;
}

function searchTerms(question: string) {
  const normalized = question.toLocaleLowerCase();
  const terms = new Set<string>(normalized.match(/[a-z0-9]{2,}|[\u4e00-\u9fff]{2,}/g) ?? []);
  for (const phrase of normalized.match(/[\u4e00-\u9fff]{3,}/g) ?? []) {
    for (let index = 0; index < phrase.length - 1; index += 1) terms.add(phrase.slice(index, index + 2));
  }
  return [...terms];
}

function rankSources(question: string, sources: KnowledgeSource[]) {
  const normalized = question.toLocaleLowerCase();
  const terms = searchTerms(question);
  const ranked = sources.map((source) => {
    const title = source.title.toLocaleLowerCase();
    const content = source.content.toLocaleLowerCase();
    let score = title.includes(normalized) ? 24 : 0;
    for (const term of terms) {
      if (title.includes(term)) score += 8;
      if (content.includes(term)) score += 2;
    }
    if (/行情|市值|股价|估值|涨跌|市销率/.test(question) && source.type === "EAC 动态数据") score += 6;
    if (/路演|投资人|融资|基金/.test(question) && source.type === "投资人路演记录") score += 6;
    return { source, score };
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score).slice(0, MAX_SOURCES).map(({ source }) => source);

  // Broad questions such as "what should we monitor" still need a grounded answer.
  // In that case, let the model summarize the most recently updated accessible records.
  if (ranked.length) return ranked;
  return [...sources]
    .sort((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))
    .slice(0, MAX_SOURCES);
}

function checkRateLimit(userId: string) {
  const limit = Math.max(1, Number(process.env.AI_AGENT_MAX_REQUESTS_PER_HOUR ?? "20"));
  const cutoff = Date.now() - 60 * 60 * 1_000;
  const active = (requestWindows.get(userId) ?? []).filter((time) => time > cutoff);
  if (active.length >= limit) throw new AgentRateLimitError("本小时 AI 问答次数已达上限，请稍后再试。");
  active.push(Date.now());
  requestWindows.set(userId, active);
}

async function collectSources(user: AuthUser): Promise<KnowledgeSource[]> {
  const [knowledge, intelligence, roadshows, companyList, market] = await Promise.all([
    listResearchItems(user), listIntelligence(user, { sort: "newest" }), listRoadshows(user), listCompanyResearch(user), getComparableMarketData(),
  ]);
  const sources: KnowledgeSource[] = [];
  for (const item of knowledge.items) sources.push({ id: `research:${item.id}`, type: "研究知识库", title: item.title, href: `/research/${item.id}`, updatedAt: item.updatedAt, content: toText([item.summary, `发生了什么：${item.whatHappened}`, `为什么重要：${item.whyItMatters}`, `对 CloudSky 的影响：${item.cloudskyImplication}`, `建议行动：${item.recommendedAction}`, item.nextAction && `下一步：${item.nextAction}`, item.details]) });
  for (const item of intelligence.items) sources.push({ id: `intelligence:${item.id}`, type: "行业动态", title: item.title, href: `/intelligence/${item.id}`, updatedAt: item.publishedAt, content: toText([item.summary, item.details, item.relationshipToCloudsky && `对 CloudSky 的影响：${item.relationshipToCloudsky}`, item.tags?.join("、")]) });
  for (const record of roadshows.records) sources.push({ id: `roadshow:${record.id}`, type: "投资人路演记录", title: `${record.investorAccountName}｜${record.title}`, href: "/roadshows", updatedAt: record.occurredAt, content: toText([`时间：${record.occurredAt}`, record.keyTakeaways && `关键结论：${record.keyTakeaways}`, record.transcript, record.nextAction && `下一步：${record.nextAction}`, record.segments.map((segment) => `${segment.speaker ?? "未标注"}：${segment.content}`)]) });
  const details = await Promise.all(companyList.items.filter((item) => item.reportId).map((item) => getCompanyResearch(user, item.companyId)));
  for (const detail of details) {
    if (!detail?.report) continue;
    sources.push({ id: `company:${detail.company.id}`, type: "公司研究", title: detail.company.name, href: `/company-research/${detail.company.id}`, updatedAt: detail.report.updatedAt, content: toText([detail.company.industry, detail.report.conclusionSummary, detail.report.coreTension && `核心矛盾：${detail.report.coreTension}`, detail.sections.map((section) => `${section.title}：${section.content ?? ""}`), detail.assumptions.map((assumption) => `${assumption.title}；支持：${assumption.supportEvidence ?? ""}；反证：${assumption.counterEvidence ?? ""}`), detail.metrics.map((metric) => `${metric.label} ${metric.value ?? ""}${metric.unit ?? ""} ${metric.periodEnd ?? ""}`)]) });
  }
  const marketByTicker = new Map(market.items.map((item) => [item.ticker, item]));
  for (const security of comparableUniverse) {
    const item = marketByTicker.get(security.ticker);
    if (!item) continue;
    sources.push({ id: `market:${security.ticker}`, type: "EAC 动态数据", title: `${security.name}（${security.ticker}）`, href: "/eac-data", updatedAt: item.priceAsOf, content: toText([`市场：${security.market}`, `收盘价：${item.price ?? "暂无"} ${item.currency}`, `昨日涨跌：${item.priceChangePercent ?? "暂无"}%`, `30 日涨跌：${item.thirtyDayChangePercent ?? "暂无"}%`, `今年涨跌：${item.yearToDateChangePercent ?? "暂无"}%`, `市值：${item.marketCap ?? "暂无"} ${item.currency}`, `收入：${item.revenue ?? "暂无"} ${item.financialCurrency}`, `毛利率：${item.grossMargin ?? "暂无"}`, `净利率：${item.netMargin ?? "暂无"}`]) });
  }
  return sources.filter((source) => source.content.trim());
}

function configuredModel(): AgentModelId {
  const model = process.env.AI_AGENT_MODEL?.trim();
  return model && agentModelIds.has(model) ? model as AgentModelId : "qwen3.7-plus";
}

function bailianConfiguration(model?: AgentModelId) {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  const configuredBaseUrl = process.env.DASHSCOPE_BASE_URL?.trim();
  return {
    apiKey,
    model: model ?? configuredModel(),
    baseUrl: (configuredBaseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, ""),
    needsWorkspaceBaseUrl: Boolean(apiKey?.startsWith("sk-ws-") && !configuredBaseUrl),
  };
}

export function getResearchAgentStatus() {
  const config = bailianConfiguration();
  return {
    configured: Boolean(config.apiKey) && !config.needsWorkspaceBaseUrl,
    model: config.model,
    defaultModel: config.model,
    models: agentModels,
    configurationMessage: config.needsWorkspaceBaseUrl
      ? "当前百炼业务空间密钥需要配置该业务空间的 OpenAI 兼容地址。"
      : null,
  };
}

function contentFromResponse(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((part) => typeof part === "object" && part && "text" in part ? String(part.text ?? "") : "").join("").trim();
  return "";
}

export async function answerResearchQuestion(user: AuthUser, question: string, model?: AgentModelId) {
  if (model && !agentModelIds.has(model)) throw new AgentConfigurationError("所选模型不在 Research Agent 的可用范围内。");
  const config = bailianConfiguration(model);
  if (!config.apiKey) throw new AgentConfigurationError("Research Agent 尚未配置百炼服务。");
  if (config.needsWorkspaceBaseUrl) {
    throw new AgentConfigurationError("当前百炼业务空间密钥需要配置 DASHSCOPE_BASE_URL，请使用业务空间详情中的 OpenAI 兼容地址。");
  }
  checkRateLimit(user.id);
  const retrieved = rankSources(question, await collectSources(user));
  if (!retrieved.length) return { answer: "现有已授权资料中没有找到足以回答该问题的内容。建议补充公司研究、行业动态或路演记录后再提问。", citations: [] as AgentCitation[], model: config.model };
  let contextSize = 0;
  const context = retrieved.map((source, index) => {
    const excerpt = clip(source.content);
    contextSize += excerpt.length;
    return contextSize <= MAX_CONTEXT_CHARS ? `[S${index + 1}] ${source.type}｜${source.title}\n${excerpt}` : "";
  }).filter(Boolean).join("\n\n");
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, temperature: 0.1, max_tokens: 1200, messages: [
      { role: "system", content: "你是 CloudSky 的内部研究助理。只能依据提供的内部资料回答，不能使用常识补齐、编造数字或给出买卖建议。事实性陈述后标注对应来源编号，如 [S1]。资料不足、时间过期或互相矛盾时，明确说明。回答使用简洁中文，并区分事实、推断和待验证项。" },
      { role: "user", content: `问题：${question}\n\n已授权资料：\n${context}` },
    // Long internal context can make first-token latency exceed 45 seconds.
    // Keep the request bounded, but leave room for Bailian's occasional slow response.
    ] }), signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new AgentProviderError(`百炼拒绝访问（403）。请在该业务空间中为 ${config.model} 开通模型调用权限后重试。`);
    }
    if (response.status === 401) {
      throw new AgentProviderError("百炼密钥或业务空间地址未通过验证，请检查当前业务空间配置。");
    }
    throw new AgentProviderError("百炼暂时未能完成回答，请稍后重试。");
  }
  const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
  const answer = contentFromResponse(payload.choices?.[0]?.message?.content);
  if (!answer) throw new AgentProviderError("百炼没有返回可用回答，请稍后重试。");
  return { answer, model: config.model, citations: retrieved.map((source) => ({ id: source.id, type: source.type, title: source.title, href: source.href, updatedAt: source.updatedAt, excerpt: clip(source.content, 220) })) };
}
