"use client";

import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CircleAlert,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useApiData } from "@/lib/client/use-api-data";
import {
  dimensionMeta,
  importanceLabels,
  statusLabels,
  subtypeMeta,
  technologyTags,
  type ResearchDimension,
  type ResearchItemRecord,
  type ResearchKnowledgeListResult,
} from "@/lib/research-knowledge/types";
import { EmptyState, PageHeader, SectionCard, Skeleton, StatusBadge } from "./ui/workbench-primitives";

type Period = "ALL" | "7" | "30";

function formatDate(value: string | null) {
  if (!value) return "暂无数据";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00+08:00`));
}

function importanceTone(importance: ResearchItemRecord["importance"]) {
  if (importance === "CRITICAL") return "danger" as const;
  if (importance === "HIGH") return "warning" as const;
  return "neutral" as const;
}

function statusTone(status: ResearchItemRecord["status"]) {
  if (status === "ACTION_REQUIRED") return "warning" as const;
  if (status === "REVIEWED") return "success" as const;
  if (status === "TRACKING") return "info" as const;
  return "neutral" as const;
}

function ResearchItemCard({ item }: { item: ResearchItemRecord }) {
  return (
    <Link className="research-item-card" href={`/research/${item.id}`}>
      <div className="research-item-card-meta">
        <span>{formatDate(item.eventDate)}</span>
        <StatusBadge tone={importanceTone(item.importance)}>
          {importanceLabels[item.importance]}重要
        </StatusBadge>
        <StatusBadge tone={statusTone(item.status)}>{statusLabels[item.status]}</StatusBadge>
      </div>
      <strong>{item.title}</strong>
      <p>{item.summary}</p>
      <div className="research-item-card-footer">
        <span>{subtypeMeta[item.dimension][item.subtype]}</span>
        <span>{item.organizations.map((organization) => organization.name).join(" · ") || "未关联机构"}</span>
        <ArrowUpRight aria-hidden="true" size={15} />
      </div>
    </Link>
  );
}

function ResearchSkeleton() {
  return (
    <main className="os-command-page research-kb-page" aria-label="正在加载研究知识库">
      <div className="os-loading-header"><Skeleton className="os-skeleton-title" /><Skeleton className="os-skeleton-copy" /></div>
      <div className="research-module-grid">{[1, 2, 3].map((item) => <Skeleton className="os-skeleton-panel" key={item} />)}</div>
      <Skeleton className="os-skeleton-panel research-kb-skeleton" />
    </main>
  );
}

function CreateResearchItem({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [dimension, setDimension] = useState<ResearchDimension>("MARKET");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sourceUrl = String(form.get("sourceUrl") ?? "").trim();
    const organizationName = String(form.get("organizationName") ?? "").trim();
    const payload = {
      dimension,
      subtype: String(form.get("subtype")),
      title: String(form.get("title")),
      summary: String(form.get("summary")),
      whatHappened: String(form.get("whatHappened")),
      whyItMatters: String(form.get("whyItMatters")),
      cloudskyImplication: String(form.get("cloudskyImplication")),
      recommendedAction: String(form.get("recommendedAction")),
      eventDate: String(form.get("eventDate")),
      importance: String(form.get("importance")),
      confidence: String(form.get("confidence")),
      status: String(form.get("status")),
      nextAction: String(form.get("nextAction")) || null,
      nextFollowUpDate: String(form.get("nextFollowUpDate")) || null,
      details: {
        technologyTags: String(form.get("technologyTags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        counterEvidence: String(form.get("counterEvidence") ?? "").trim() || null,
      },
      organizations: organizationName
        ? [{ name: organizationName, relationship: String(form.get("organizationRelationship")) || null }]
        : [],
      sources: [{
        sourceType: String(form.get("sourceType")),
        title: String(form.get("sourceTitle")),
        url: sourceUrl || null,
        publisher: String(form.get("sourcePublisher")) || null,
        publishedAt: String(form.get("sourcePublishedAt"))
          ? new Date(`${String(form.get("sourcePublishedAt"))}T00:00:00Z`).toISOString()
          : null,
      }],
    };
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "保存失败，请检查必填字段和来源链接。");
      await onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard action={<button className="os-text-button" onClick={onClose} type="button">取消</button>} eyebrow="研究录入" title="新增研究条目">
      <form className="research-form" onSubmit={submit}>
        <div className="research-form-grid three">
          <label>模块<select onChange={(event) => setDimension(event.target.value as ResearchDimension)} value={dimension}>{Object.entries(dimensionMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
          <label>研究类型<select name="subtype">{Object.entries(subtypeMeta[dimension]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>事件日期<input defaultValue={new Date().toISOString().slice(0, 10)} name="eventDate" required type="date" /></label>
          <label>重要程度<select defaultValue="MEDIUM" name="importance"><option value="LOW">低</option><option value="MEDIUM">中</option><option value="HIGH">高</option><option value="CRITICAL">关键</option></select></label>
          <label>置信度<select defaultValue="MEDIUM" name="confidence"><option value="LOW">低</option><option value="MEDIUM">中</option><option value="HIGH">高</option></select></label>
          <label>状态<select defaultValue="INBOX" name="status"><option value="INBOX">待审阅</option><option value="REVIEWED">已审阅</option><option value="TRACKING">跟进中</option><option value="ACTION_REQUIRED">需要行动</option></select></label>
        </div>
        <label>标题<input name="title" placeholder="用一句话说明研究判断" required /></label>
        <label>一句话摘要<textarea name="summary" placeholder="概括变化、判断与 CloudSky 相关性" required /></label>
        <div className="research-form-grid two">
          <label>发生了什么<textarea name="whatHappened" required /></label>
          <label>为什么值得关注<textarea name="whyItMatters" required /></label>
          <label>对 CloudSky 意味着什么<textarea name="cloudskyImplication" required /></label>
          <label>建议行动<textarea name="recommendedAction" required /></label>
        </div>
        <div className="research-form-grid two">
          <label>下一步行动<input name="nextAction" placeholder="可执行的下一步" required /></label>
          <label>下次跟进日期<input name="nextFollowUpDate" required type="date" /></label>
          <label>相关机构<input name="organizationName" placeholder="公司、大学、实验室等" /></label>
          <label>关联说明<input name="organizationRelationship" placeholder="例如：竞争对手、合作机构" /></label>
        </div>
        {dimension === "TECHNOLOGY" && <label>技术标签（逗号分隔）<input name="technologyTags" placeholder={technologyTags.slice(0, 4).join("、")} /></label>}
        <label>反方信息和不确定性<textarea name="counterEvidence" placeholder="没有已核验的反方信息时可留空；不要以推断替代事实。" /></label>
        <div className="research-source-block">
          <strong>原始来源</strong>
          <div className="research-form-grid two">
            <label>来源类型<input defaultValue="公开网页" name="sourceType" required /></label>
            <label>来源标题<input name="sourceTitle" required /></label>
            <label>来源链接<input name="sourceUrl" placeholder="https://" type="url" /></label>
            <label>发布机构<input name="sourcePublisher" /></label>
            <label>发布日期<input name="sourcePublishedAt" type="date" /></label>
          </div>
        </div>
        {error && <p className="research-write-error">{error}</p>}
        <div className="research-form-actions"><button className="os-refresh-button" disabled={saving} type="submit"><Plus size={15} />{saving ? "保存中" : "保存研究条目"}</button></div>
      </form>
    </SectionCard>
  );
}

export function ResearchKnowledgeView({ user }: { user: AuthUser }) {
  const [dimension, setDimension] = useState<ResearchDimension | "ALL">("ALL");
  const [period, setPeriod] = useState<Period>("ALL");
  const [query, setQuery] = useState("");
  const [techTab, setTechTab] = useState<"TREND" | "ACADEMIC">("TREND");
  const [createOpen, setCreateOpen] = useState(false);
  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dimension !== "ALL") params.set("dimension", dimension);
    if (period !== "ALL") params.set("days", period);
    return `/api/research${params.size ? `?${params.toString()}` : ""}`;
  }, [dimension, period]);
  const state = useApiData<ResearchKnowledgeListResult>(requestUrl);
  const canCreate = hasPermission(user, "research.create");

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return (state.data?.items ?? []).filter((item) => {
      if (dimension === "TECHNOLOGY" && techTab === "ACADEMIC" && item.subtype !== "ACADEMIC_COLLABORATION") return false;
      if (dimension === "TECHNOLOGY" && techTab === "TREND" && item.subtype === "ACADEMIC_COLLABORATION") return false;
      if (!normalized) return true;
      return [item.title, item.summary, item.whatHappened, ...item.organizations.map((org) => org.name)].join(" ").toLocaleLowerCase().includes(normalized);
    });
  }, [dimension, query, state.data?.items, techTab]);

  if (state.loading) return <ResearchSkeleton />;
  if (state.error || !state.data) {
    return <main className="os-command-page research-kb-page"><EmptyState description="请求失败时不会使用缓存内容或虚构数据代替。" title="研究知识库暂时无法加载" /></main>;
  }

  const highPriority = state.data.items.filter((item) => item.importance === "HIGH" || item.importance === "CRITICAL").slice(0, 3);
  const marketFocus = state.data.items.find((item) => item.dimension === "MARKET");
  const technologyFocus = state.data.items.find((item) => item.dimension === "TECHNOLOGY");
  const businessFocus = state.data.items.find((item) => item.dimension === "BUSINESS_MODEL");

  return (
    <main className="os-command-page research-kb-page">
      <PageHeader
        actions={canCreate ? <button className="os-refresh-button" onClick={() => setCreateOpen(true)} type="button"><Plus size={16} />新增研究</button> : undefined}
        description="围绕研究判断、CloudSky 影响和下一步行动组织信息；来源与版本留在后台可追溯。"
        meta={<StatusBadge tone="info">{state.data.total} 条已保存研究</StatusBadge>}
        title="研究知识库"
      />

      <section className="research-module-grid" aria-label="研究模块">
        {state.data.modules.map((module) => {
          const meta = dimensionMeta[module.dimension];
          const Icon = module.dimension === "MARKET" ? Lightbulb : module.dimension === "TECHNOLOGY" ? FlaskConical : Sparkles;
          return <button className={`research-module-card ${dimension === module.dimension ? "is-active" : ""}`} key={module.dimension} onClick={() => setDimension((value) => value === module.dimension ? "ALL" : module.dimension)} type="button">
            <div><Icon size={18} /><span>{meta.english}</span></div><strong>{meta.label}</strong><p>{meta.description}</p>
            <dl><div><dt>条目</dt><dd>{module.total}</dd></div><div><dt>本周新增</dt><dd>{module.weekNew}</dd></div><div><dt>高重要性</dt><dd>{module.highImportance}</dd></div><div><dt>待行动</dt><dd>{module.actionRequired}</dd></div></dl>
          </button>;
        })}
      </section>

      {createOpen && canCreate && <CreateResearchItem onClose={() => setCreateOpen(false)} onSaved={state.retry} />}

      <div className="research-home-grid">
        <SectionCard action={<StatusBadge tone={state.data.pendingReview ? "warning" : "success"}>{state.data.pendingReview ? `${state.data.pendingReview} 条待审阅` : "没有待审阅条目"}</StatusBadge>} eyebrow="优先事项" title="本周最值得关注">
          <div className="research-focus-list">{highPriority.length ? highPriority.map((item) => <ResearchItemCard item={item} key={item.id} />) : <EmptyState description="没有已核验的高重要性研究条目。" title="暂无优先事项" />}</div>
        </SectionCard>
        <SectionCard action={<ClipboardCheck size={16} />} eyebrow="下一步" title="建议动作">
          <div className="research-action-list">{state.data.suggestedActions.length ? state.data.suggestedActions.map((item) => <Link href={`/research/${item.id}`} key={item.id}><CircleAlert size={15} /><span><strong>{item.nextAction || item.recommendedAction}</strong><small>{item.title}</small></span><ArrowUpRight size={14} /></Link>) : <EmptyState description="研究条目尚未设置待办行动。" title="暂无待执行动作" />}</div>
        </SectionCard>
      </div>

      <section className="research-spotlight-grid" aria-label="三个模块重点">
        {[marketFocus, technologyFocus, businessFocus].map((item, index) => <div className="research-spotlight" key={item?.id ?? index}><span>{["市场变化", "技术机会", "盈利模式"][index]}</span>{item ? <Link href={`/research/${item.id}`}>{item.title}<ArrowUpRight size={14} /></Link> : <p>暂无已核验研究</p>}</div>)}
      </section>

      <SectionCard
        action={<div className="research-toolbar"><label><Search size={15} /><input aria-label="搜索研究知识库" onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、摘要或机构" value={query} /></label></div>}
        eyebrow={dimension === "ALL" ? "全部研究" : dimensionMeta[dimension].english}
        title={dimension === "ALL" ? "研究条目" : dimensionMeta[dimension].label}
      >
        <div className="research-filter-row">
          <div className="os-filter-pills" aria-label="Research module filters">{(["ALL", "MARKET", "TECHNOLOGY", "BUSINESS_MODEL"] as const).map((value) => <button className={dimension === value ? "is-active" : ""} key={value} onClick={() => setDimension(value)} type="button">{value === "ALL" ? "全部" : dimensionMeta[value].label}</button>)}</div>
          {dimension === "MARKET" && <div className="os-filter-pills" aria-label="Market date range">{(["ALL", "7", "30"] as Period[]).map((value) => <button className={period === value ? "is-active" : ""} key={value} onClick={() => setPeriod(value)} type="button">{value === "ALL" ? "全部" : `最近${value}天`}</button>)}</div>}
          {dimension === "TECHNOLOGY" && <div className="os-filter-pills" aria-label="Technology categories"><button className={techTab === "TREND" ? "is-active" : ""} onClick={() => setTechTab("TREND")} type="button">技术趋势</button><button className={techTab === "ACADEMIC" ? "is-active" : ""} onClick={() => setTechTab("ACADEMIC")} type="button">高校及科研合作</button></div>}
        </div>
        {dimension === "TECHNOLOGY" && <div className="research-tag-row">{technologyTags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        <div className="research-list">{visibleItems.length ? visibleItems.map((item) => <ResearchItemCard item={item} key={item.id} />) : <EmptyState description="请调整筛选条件，或新增一条有来源支撑的研究内容。" title="暂无匹配研究" />}</div>
      </SectionCard>

      <SectionCard action={<CalendarClock size={16} />} eyebrow="跟进计划" title="临近跟进日期">
        <div className="research-followup-list">{state.data.upcomingFollowUps.length ? state.data.upcomingFollowUps.map((item) => <Link href={`/research/${item.id}`} key={item.id}><Building2 size={15} /><span><strong>{item.title}</strong><small>{item.nextAction || "待补充下一步行动"}</small></span><time>{formatDate(item.nextFollowUpDate)}</time></Link>) : <EmptyState description="高校合作和研究任务暂未设置未来 14 天的跟进日期。" title="暂无临近跟进" />}</div>
      </SectionCard>
    </main>
  );
}
