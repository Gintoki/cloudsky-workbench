"use client";

import {
  ArrowUpRight,
  Bot,
  CirclePlus,
  CornerDownLeft,
  Database,
  History,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useApiData } from "@/lib/client/use-api-data";
import type { AuthUser } from "@/lib/auth/types";
import { EmptyState, PageHeader, SectionCard, Skeleton, StatusBadge } from "./ui/workbench-primitives";

type Citation = {
  id: string;
  type: string;
  title: string;
  href: string;
  updatedAt: string | null | undefined;
  excerpt: string;
};
type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Citation[];
  createdAt: string;
  writebackResearchItemId: string | null;
};
type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
};
type AgentStatus = {
  configured: boolean;
  model: string;
  defaultModel: AgentModelId;
  models: AgentModelOption[];
  configurationMessage: string | null;
  conversations: Conversation[];
};
type AgentModelId = "qwen3.7-plus" | "qwen3.8-max" | "qwen3.7-plus-2026-05-26";
type AgentModelOption = {
  id: AgentModelId;
  label: string;
  description: string;
  recommended: boolean;
};
type Answer = {
  answer: string;
  citations: Citation[];
  model: string;
  conversation: Conversation | null;
};

const suggestions = [
  "总结本周最关键的市场信号",
  "有哪些公司研究的核心矛盾仍待验证？",
  "最近路演中的主要关注点是什么？",
];

const dimensionOptions = [
  ["MARKET", "市场情况"],
  ["TECHNOLOGY", "技术路线"],
  ["BUSINESS_MODEL", "盈利模式"],
] as const;

function dateLabel(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(new Date(value))
    : "未标注日期";
}

function messagesFromConversation(conversation: Conversation | null) {
  return conversation?.messages ?? [];
}

export function ResearchAgentView({ user }: { user: AuthUser }) {
  const status = useApiData<AgentStatus>("/api/research-agent");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [writingMessageId, setWritingMessageId] = useState<string | null>(null);
  const [writebackDimension, setWritebackDimension] = useState<(typeof dimensionOptions)[number][0]>("MARKET");
  const [selectedModel, setSelectedModel] = useState<AgentModelId | "">("");
  const [error, setError] = useState("");
  const canWriteBack = user.role === "ADMINISTRATOR" || user.role === "DIRECTOR";

  function resetConversation() {
    setSelectedConversationId(null);
    setMessages([]);
    setError("");
    setQuestion("");
  }

  async function openConversation(conversationId: string) {
    if (conversationId === selectedConversationId || loadingConversation) return;
    setLoadingConversation(true);
    setError("");
    try {
      const response = await fetch(`/api/research-agent/${conversationId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "无法读取问答历史。");
      const conversation = payload.data as Conversation;
      setSelectedConversationId(conversation.id);
      setMessages(messagesFromConversation(conversation));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "无法读取问答历史。");
    } finally {
      setLoadingConversation(false);
    }
  }

  async function ask(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const prompt = question.trim();
    if (!prompt || sending || !status.data?.configured) return;
    const model = selectedModel || status.data.defaultModel;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/research-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: prompt, model, ...(selectedConversationId ? { conversationId: selectedConversationId } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Research Agent 暂时无法回答。");
      const data = payload.data as Answer;
      if (!data.conversation) throw new Error("问答已完成，但历史记录未能保存。");
      setQuestion("");
      setSelectedConversationId(data.conversation.id);
      setMessages(messagesFromConversation(data.conversation));
      status.setData((current) => current ? {
        ...current,
        conversations: [
          data.conversation!,
          ...current.conversations.filter((item) => item.id !== data.conversation!.id),
        ],
      } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Research Agent 暂时无法回答。");
    } finally {
      setSending(false);
    }
  }

  async function writeBack(messageId: string) {
    if (!selectedConversationId || writingMessageId) return;
    setWritingMessageId(messageId);
    setError("");
    try {
      const response = await fetch(`/api/research-agent/${selectedConversationId}/writeback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messageId, dimension: writebackDimension }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "无法写入研究知识库。");
      const researchItemId = payload.data.id as string;
      setMessages((items) => items.map((item) => item.id === messageId ? { ...item, writebackResearchItemId: researchItemId } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "无法写入研究知识库。");
    } finally {
      setWritingMessageId(null);
    }
  }

  if (status.loading) return <main className="os-command-page research-agent-page"><div className="os-loading-header"><Skeleton className="os-skeleton-title" /><Skeleton className="os-skeleton-copy" /></div><Skeleton className="os-skeleton-panel" /></main>;
  if (status.error || !status.data) return <main className="os-command-page research-agent-page"><EmptyState title="Research Agent 暂时不可用" description="服务状态无法读取，请稍后重试。" /></main>;
  const agentStatus = status.data;
  const conversations = agentStatus.conversations;
  const activeModel = selectedModel || agentStatus.defaultModel;

  return <main className="os-command-page research-agent-page">
    <PageHeader title="Research Agent" description="基于个人权限范围内研究资料的问答工作台" meta={<StatusBadge tone={agentStatus.configured ? "success" : "warning"}>{agentStatus.configured ? `百炼已配置 · ${agentStatus.model}` : "百炼待配置"}</StatusBadge>} />
    <div className="research-agent-top-tools">
      <SectionCard eyebrow="SUGGESTED" title="建议提问"><div className="research-agent-suggestions is-horizontal">{suggestions.map((suggestion) => <button disabled={!agentStatus.configured || sending} key={suggestion} onClick={() => setQuestion(suggestion)} type="button">{suggestion}<ArrowUpRight size={14} /></button>)}</div></SectionCard>
      {canWriteBack ? <SectionCard eyebrow="CONTROLLED WRITE" title="写入规则"><div className="research-agent-writeback-note"><Database size={16} /><span>仅可写入“待审核”草稿。写入后仍需人工核验来源与结论。</span></div></SectionCard> : <SectionCard eyebrow="ACCESS" title="个人问答"><div className="research-agent-writeback-note"><ShieldCheck size={16} /><span>你的问答历史仅对你本人可见。研究库写入需由投融资总监或管理员执行。</span></div></SectionCard>}
    </div>
    <div className="research-agent-layout">
      <aside className="research-agent-history-panel">
        <SectionCard eyebrow="PERSONAL HISTORY" title="我的问答">
          <div className="research-agent-history-actions"><button className="os-refresh-button" onClick={resetConversation} type="button"><CirclePlus size={15} />新建问答</button></div>
          <div className="research-agent-history-list">
            {!conversations.length ? <p>还没有已保存的问答。</p> : conversations.map((conversation) => <button className={conversation.id === selectedConversationId ? "is-active" : ""} key={conversation.id} onClick={() => void openConversation(conversation.id)} type="button"><History size={14} /><span><strong>{conversation.title}</strong><small>{dateLabel(conversation.updatedAt)}</small></span></button>)}
          </div>
        </SectionCard>
        <SectionCard eyebrow="SCOPE" title="可检索资料"><div className="research-agent-scope"><span>研究知识库</span><span>公司研究</span><span>行业动态</span><span>EAC 动态数据</span><span>投资人路演记录</span></div></SectionCard>
      </aside>
      <SectionCard className="research-agent-chat" eyebrow="INTERNAL RAG" title={selectedConversationId ? "继续问答" : "研究问答"}>
        {!agentStatus.configured && <div className="research-agent-notice"><ShieldCheck size={16} /><span>{agentStatus.configurationMessage ?? "百炼服务尚未由管理员配置，当前不会发送任何研究资料。"}</span></div>}
        <div className="research-agent-messages" aria-live="polite">
          {!messages.length && !loadingConversation && <div className="research-agent-empty"><Bot size={22} /><strong>从一个研究问题开始</strong><span>每条问答只使用你有权限查看的内部资料，并自动保存在你的个人历史中。</span></div>}
          {loadingConversation && <div className="research-agent-empty"><LoaderCircle className="is-spinning" size={22} /><span>正在读取个人问答历史...</span></div>}
          {messages.map((message) => <article className={`research-agent-message is-${message.role.toLowerCase()}`} key={message.id}><div>{message.role === "ASSISTANT" ? <Sparkles size={15} /> : <span>你</span>}</div><section><p>{message.content}</p>{message.citations.length ? <div className="research-agent-citations">{message.citations.map((citation) => <Link href={citation.href} key={citation.id}><span>{citation.type}</span><strong>{citation.title}</strong><small>{dateLabel(citation.updatedAt)} · {citation.excerpt}</small><ArrowUpRight size={13} /></Link>)}</div> : null}{message.role === "ASSISTANT" && canWriteBack && message.citations.length ? <div className="research-agent-writeback">{message.writebackResearchItemId ? <Link href={`/research/${message.writebackResearchItemId}`}><Database size={14} />已写入待审核草稿</Link> : <><select aria-label="写入模块" disabled={Boolean(writingMessageId)} onChange={(event) => setWritebackDimension(event.target.value as (typeof dimensionOptions)[number][0])} value={writebackDimension}>{dimensionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button disabled={Boolean(writingMessageId)} onClick={() => void writeBack(message.id)} type="button">{writingMessageId === message.id ? <LoaderCircle className="is-spinning" size={14} /> : <Database size={14} />}写入待审核草稿</button></>}</div> : null}</section></article>)}
          {sending && <article className="research-agent-message is-assistant"><div><LoaderCircle className="is-spinning" size={15} /></div><section><p>正在检索已授权的研究资料并生成回答...</p></section></article>}
        </div>
        {error && <p className="research-agent-error">{error}</p>}
        <form className="research-agent-composer" onSubmit={(event) => void ask(event)}><select aria-label="选择模型" disabled={!agentStatus.configured || sending || loadingConversation} onChange={(event) => setSelectedModel(event.target.value as AgentModelId)} value={activeModel}>{agentStatus.models.map((model) => <option key={model.id} value={model.id}>{model.label} - {model.description}</option>)}</select><textarea aria-label="向 Research Agent 提问" disabled={!agentStatus.configured || sending || loadingConversation} onChange={(event) => setQuestion(event.target.value)} placeholder={agentStatus.configured ? "输入研究问题" : "等待百炼服务配置"} value={question} /><button aria-label="发送问题" className="os-refresh-button" disabled={!question.trim() || !agentStatus.configured || sending || loadingConversation} type="submit">{sending ? <LoaderCircle className="is-spinning" size={16} /> : <Send size={16} />}</button><CornerDownLeft aria-hidden="true" size={14} /></form>
      </SectionCard>
    </div>
  </main>;
}
