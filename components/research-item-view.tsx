"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  History,
  Pencil,
  Quote,
  Save,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useApiData } from "@/lib/client/use-api-data";
import {
  confidenceLabels,
  dimensionMeta,
  importanceLabels,
  statusLabels,
  subtypeMeta,
  type ResearchItemInput,
  type ResearchItemRecord,
} from "@/lib/research-knowledge/types";
import { EmptyState, PageHeader, SectionCard, Skeleton, StatusBadge } from "./ui/workbench-primitives";

function formatDate(value: string | null) {
  if (!value) return "暂无数据";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(new Date(`${value.slice(0, 10)}T00:00:00+08:00`));
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <SectionCard title={title}>{children}</SectionCard>;
}

function researchPayload(item: ResearchItemRecord, form: FormData): ResearchItemInput {
  const sourceTitle = String(form.get("sourceTitle") ?? "").trim();
  const sourceUrl = String(form.get("sourceUrl") ?? "").trim();
  const sources = item.sources.map((source, index) => index === 0 ? { ...source, title: sourceTitle || source.title, url: sourceUrl || null } : source);
  return {
    dimension: item.dimension,
    subtype: item.subtype,
    title: String(form.get("title")),
    summary: String(form.get("summary")),
    whatHappened: String(form.get("whatHappened")),
    whyItMatters: String(form.get("whyItMatters")),
    cloudskyImplication: String(form.get("cloudskyImplication")),
    recommendedAction: String(form.get("recommendedAction")),
    eventDate: String(form.get("eventDate")),
    importance: String(form.get("importance")) as ResearchItemRecord["importance"],
    confidence: String(form.get("confidence")) as ResearchItemRecord["confidence"],
    status: String(form.get("status")) as ResearchItemRecord["status"],
    nextAction: String(form.get("nextAction")) || null,
    nextFollowUpDate: String(form.get("nextFollowUpDate")) || null,
    details: { ...item.details, counterEvidence: String(form.get("counterEvidence")) || null },
    organizations: item.organizations.map((organization) => ({
      name: organization.name,
      organizationType: organization.organizationType,
      country: organization.country,
      website: organization.website,
      description: organization.description,
      relationship: organization.relationship,
    })),
    sources: sources.map((source) => ({
      sourceType: source.sourceType,
      title: source.title,
      url: source.url,
      filePath: source.filePath,
      publisher: source.publisher,
      publishedAt: source.publishedAt,
      pageNumber: source.pageNumber,
      quotedText: source.quotedText,
    })),
    changeSummary: "更新研究判断与行动计划",
  };
}

function EditResearchItem({ item, onSaved, onCancel }: { item: ResearchItemRecord; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstSource = item.sources[0];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/research/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(researchPayload(item, new FormData(event.currentTarget))) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "保存失败，请稍后重试。");
      await onSaved();
      onCancel();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败，请稍后重试。");
    } finally { setSaving(false); }
  }
  return <SectionCard action={<button className="os-text-button" onClick={onCancel} type="button">取消</button>} eyebrow="编辑模式" title="更新研究条目">
    <form className="research-form" onSubmit={submit}>
      <div className="research-form-grid three"><label>事件日期<input defaultValue={item.eventDate} name="eventDate" required type="date" /></label><label>重要程度<select defaultValue={item.importance} name="importance"><option value="LOW">低</option><option value="MEDIUM">中</option><option value="HIGH">高</option><option value="CRITICAL">关键</option></select></label><label>置信度<select defaultValue={item.confidence} name="confidence"><option value="LOW">低</option><option value="MEDIUM">中</option><option value="HIGH">高</option></select></label><label>状态<select defaultValue={item.status} name="status"><option value="INBOX">待审阅</option><option value="REVIEWED">已审阅</option><option value="TRACKING">跟进中</option><option value="ACTION_REQUIRED">需要行动</option><option value="ARCHIVED">已归档</option></select></label><label>下次跟进日期<input defaultValue={item.nextFollowUpDate ?? ""} name="nextFollowUpDate" required type="date" /></label></div>
      <label>标题<input defaultValue={item.title} name="title" required /></label><label>一句话摘要<textarea defaultValue={item.summary} name="summary" required /></label>
      <div className="research-form-grid two"><label>发生了什么<textarea defaultValue={item.whatHappened} name="whatHappened" required /></label><label>为什么值得关注<textarea defaultValue={item.whyItMatters} name="whyItMatters" required /></label><label>对 CloudSky 意味着什么<textarea defaultValue={item.cloudskyImplication} name="cloudskyImplication" required /></label><label>建议行动<textarea defaultValue={item.recommendedAction} name="recommendedAction" required /></label></div>
      <label>下一步行动<input defaultValue={item.nextAction ?? ""} name="nextAction" required /></label><label>反方信息和不确定性<textarea defaultValue={String(item.details.counterEvidence ?? "")} name="counterEvidence" /></label>
      {firstSource && <div className="research-source-block"><strong>首条原始来源</strong><div className="research-form-grid two"><label>来源标题<input defaultValue={firstSource.title} name="sourceTitle" required /></label><label>来源链接<input defaultValue={firstSource.url ?? ""} name="sourceUrl" type="url" /></label></div><p>其他已关联来源会原样保留。</p></div>}
      {error && <p className="research-write-error">{error}</p>}<div className="research-form-actions"><button className="os-refresh-button" disabled={saving} type="submit"><Save size={15} />{saving ? "保存中" : "保存并建立新版本"}</button></div>
    </form>
  </SectionCard>;
}

export function ResearchItemView({ itemId, user }: { itemId: string; user: AuthUser }) {
  const state = useApiData<ResearchItemRecord>(`/api/research/${itemId}`);
  const [editing, setEditing] = useState(false);
  if (state.loading) return <main className="os-command-page research-detail-page"><div className="os-loading-header"><Skeleton className="os-skeleton-title" /><Skeleton className="os-skeleton-copy" /></div><Skeleton className="os-skeleton-panel research-kb-skeleton" /></main>;
  if (state.error || !state.data) return <main className="os-command-page research-detail-page"><Link className="research-back" href="/research"><ArrowLeft size={15} />返回研究知识库</Link><EmptyState description="该条目可能不存在、已归档，或你没有查看权限。" title="研究条目无法加载" /></main>;
  const item = state.data;
  const canUpdate = hasPermission(user, "research.update");
  const counterEvidence = typeof item.details.counterEvidence === "string" ? item.details.counterEvidence : null;
  return <main className="os-command-page research-detail-page">
    <Link className="research-back" href="/research"><ArrowLeft size={15} />返回研究知识库</Link>
    <PageHeader actions={canUpdate ? <button className="os-refresh-button" onClick={() => setEditing(true)} type="button"><Pencil size={15} />编辑</button> : undefined} description={item.summary} meta={<><StatusBadge tone="info">{dimensionMeta[item.dimension].label}</StatusBadge><StatusBadge tone={item.importance === "CRITICAL" ? "danger" : item.importance === "HIGH" ? "warning" : "neutral"}>{importanceLabels[item.importance]}重要</StatusBadge><StatusBadge tone="neutral">{confidenceLabels[item.confidence]}</StatusBadge></>} title={item.title} />
    <section className="research-detail-summary"><div><span>研究类型</span><strong>{subtypeMeta[item.dimension][item.subtype]}</strong></div><div><span>状态</span><strong>{statusLabels[item.status]}</strong></div><div><span>事件日期</span><strong>{formatDate(item.eventDate)}</strong></div><div><span>负责人</span><strong>{item.ownerName ?? "未分配"}</strong></div><div><span>当前版本</span><strong>v{item.currentVersionNo}</strong></div></section>
    {editing && <EditResearchItem item={item} onCancel={() => setEditing(false)} onSaved={state.retry} />}
    <div className="research-detail-content">
      <DetailSection title="核心摘要"><p className="research-prose">{item.summary}</p></DetailSection>
      <DetailSection title="发生了什么"><p className="research-prose">{item.whatHappened}</p></DetailSection>
      <DetailSection title="为什么重要"><p className="research-prose">{item.whyItMatters}</p></DetailSection>
      <DetailSection title="对 CloudSky 的影响"><p className="research-prose">{item.cloudskyImplication}</p></DetailSection>
      <DetailSection title="支持证据">{item.sources.length ? <div className="research-evidence-list">{item.sources.map((source) => <article key={source.id}><Quote size={15} /><div><strong>{source.title}</strong>{source.quotedText && <p>{source.quotedText}</p>}<small>{[source.publisher, source.publishedAt ? formatDate(source.publishedAt) : null].filter(Boolean).join(" · ")}</small></div></article>)}</div> : <EmptyState description="尚未关联可核验的支持来源。" title="暂无支持证据" />}</DetailSection>
      <DetailSection title="反方信息和不确定性">{counterEvidence ? <p className="research-prose">{counterEvidence}</p> : <EmptyState description="目前没有已录入的反方信息；这不等于不存在风险。" title="待补充" />}</DetailSection>
      <DetailSection title="下一步动作"><div className="research-next-action"><CheckCircle2 size={17} /><div><strong>{item.nextAction || item.recommendedAction}</strong><span>{item.nextFollowUpDate ? `下次跟进：${formatDate(item.nextFollowUpDate)}` : "尚未设置下次跟进日期"}</span></div></div></DetailSection>
      <DetailSection title="相关机构">{item.organizations.length ? <div className="research-organization-list">{item.organizations.map((organization) => <article key={organization.id}><Building2 size={16} /><div><strong>{organization.name}</strong><span>{organization.relationship || organization.organizationType}</span></div>{organization.website && <a aria-label={`打开 ${organization.name} 网站`} href={organization.website} rel="noreferrer" target="_blank"><ExternalLink size={14} /></a>}</article>)}</div> : <EmptyState description="该研究暂未关联外部机构。" title="暂无关联机构" />}</DetailSection>
      <DetailSection title="相关研究条目">{item.relatedItems?.length ? <div className="research-related-list">{item.relatedItems.map((related) => <Link href={`/research/${related.id}`} key={related.id}><span>{formatDate(related.eventDate)}</span><strong>{related.title}</strong><ArrowUpRight size={14} /></Link>)}</div> : <EmptyState description="当前模块还没有其他可关联的研究条目。" title="暂无相关研究" />}</DetailSection>
      <DetailSection title="历史版本">{item.versions?.length ? <div className="research-version-list">{item.versions.map((version) => <article key={version.id}><History size={15} /><div><strong>v{version.versionNo} · {version.changeSummary}</strong><span>{formatDate(version.createdAt)}{version.createdByName ? ` · ${version.createdByName}` : ""}</span></div></article>)}</div> : <EmptyState description="首个版本会在条目保存后显示。" title="暂无历史版本" />}</DetailSection>
      <DetailSection title="原始来源">{item.sources.length ? <div className="research-source-list">{item.sources.map((source) => <article key={source.id}><FileText size={16} /><div><strong>{source.title}</strong><span>{source.sourceType}{source.publisher ? ` · ${source.publisher}` : ""}{source.pageNumber ? ` · 第 ${source.pageNumber} 页` : ""}</span></div>{source.url ? <a href={source.url} rel="noreferrer" target="_blank">打开来源<ExternalLink size={13} /></a> : <span className="research-source-missing">未提供链接</span>}</article>)}</div> : <EmptyState description="研究条目需至少保留一个原始来源。" title="暂无来源" />}</DetailSection>
    </div>
  </main>;
}
