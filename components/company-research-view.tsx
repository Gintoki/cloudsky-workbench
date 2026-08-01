"use client";

import {
  ArrowLeft,
  ChevronRight,
  FilePlus2,
  History,
  Pencil,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type TextareaHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { useApiData } from "@/lib/client/use-api-data";
import {
  claimKindValues,
  researchConclusionValues,
  researchSectionDefinitions,
  type CompanyResearchDetail,
  type ResearchClaimKind,
  type ResearchMetricRecord,
} from "@/lib/company-research/types";
import { ErrorState, LoadingState } from "./page-states";
import { DataTable, EmptyState, PageHeader, SectionCard, StatusBadge } from "./ui/workbench-primitives";

type Tab = (typeof researchSectionDefinitions)[number]["code"] | "versions";

const conclusionLabels: Record<string, string> = {
  POSITIVE_RESEARCH: "积极研究",
  WATCH: "观察",
  CAUTIOUS: "谨慎",
  AVOID: "回避",
  INSUFFICIENT_INFORMATION: "信息不足",
};
const claimKindLabels: Record<ResearchClaimKind, string> = {
  FACT: "事实",
  ESTIMATE: "预测",
  INFERENCE: "推断",
  OPINION: "观点",
  UNKNOWN: "未知",
};
const reportStatusLabels: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  APPROVED: "已审核",
};
const valuationStatusLabels: Record<string, string> = {
  PENDING: "待估值",
  MARKET_REFERENCE_UPDATED: "市场参考已更新",
  COMPLETED: "已完成",
};
const assumptionStatusLabels: Record<string, string> = {
  OPEN: "待验证",
  VALIDATED: "已验证",
  INVALIDATED: "已失效",
};
const observationTypeLabels: Record<string, string> = {
  CATALYST: "催化剂",
  RISK: "风险",
  BEAR_CASE: "反方观点",
  WATCH_ITEM: "跟踪事项",
};

const emptyAssumption = {
  id: undefined as string | undefined,
  title: "",
  status: "OPEN",
  supportEvidence: "",
  counterEvidence: "",
  verificationMetric: "",
  invalidationCondition: "",
  nextReviewAt: "",
  confidence: "",
  claimKind: "INFERENCE" as ResearchClaimKind,
};

function dateLabel(value: string | null) {
  if (!value) return "暂无数据";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function tone(value: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (value === "POSITIVE_RESEARCH" || value === "APPROVED" || value === "FACT") return "success";
  if (value === "CAUTIOUS" || value === "PENDING_REVIEW" || value === "ESTIMATE") return "warning";
  if (value === "AVOID") return "danger";
  if (value === "WATCH" || value === "INFERENCE") return "info";
  return "neutral";
}

function formatMetric(value: number | null, unit: string | null) {
  if (value === null) return "暂无数据";
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatFinancialMetric(metric: ResearchMetricRecord | undefined) {
  if (!metric || metric.value === null) return "-";
  if (metric.unit === "%") {
    return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(metric.value * 100)}%`;
  }
  if (metric.unit === "CNY") {
    return `¥${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(metric.value / 100_000_000)}亿`;
  }
  if (metric.unit === "USD" || metric.unit === "HKD") {
    const prefix = metric.unit === "USD" ? "US$" : "HK$";
    return `${prefix}${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(metric.value / 1_000_000_000)}bn`;
  }
  return formatMetric(metric.value, metric.unit);
}

function labelFor(value: string | null, labels: Record<string, string>, fallback = "待更新") {
  if (!value) return fallback;
  return labels[value] ?? fallback;
}

function removeHistoricalNoise(content: string) {
  return content
    .replace(/^历史资料。来源：[\s\S]*?(?:尚未按当前时点重新核验。|尚未重新核验。)\s*/, "")
    .replace(/(?:^|\n)(?:表格|复制)(?=\n|$)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sectionExcerpt(code: string, content: string | null) {
  if (!content || code === "overview" || code === "financial_quality" || code === "valuation") return null;

  const stopMarkers: Partial<Record<Tab, string[]>> = {
    business_model: ["关键假设", "业务质量", "护城河", "财务快照", "估值", "关键风险"],
    catalysts_risks: ["监控指标", "总体评估"],
  };
  const cleaned = removeHistoricalNoise(content);
  const stopAt = (stopMarkers[code as Tab] ?? [])
    .map((marker) => cleaned.indexOf(marker))
    .filter((index) => index > 0)
    .sort((left, right) => left - right)[0];
  const excerpt = stopAt === undefined ? cleaned : cleaned.slice(0, stopAt);
  return excerpt || null;
}

function ResearchTextarea({
  className,
  onChange,
  value,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resizeToContent() {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  useEffect(() => {
    resizeToContent();
  }, [value]);

  return (
    <textarea
      {...props}
      className={["company-research-textarea", className].filter(Boolean).join(" ")}
      onChange={(event) => {
        onChange?.(event);
        requestAnimationFrame(resizeToContent);
      }}
      ref={ref}
      value={value}
    />
  );
}

export function CompanyResearchView({
  companyId,
  canCreate,
  canEdit,
  canSubmit,
  canApprove,
}: {
  companyId: string;
  canCreate: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const state = useApiData<CompanyResearchDetail>(`/api/company-research/${companyId}`);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [sectionKind, setSectionKind] = useState<ResearchClaimKind>("UNKNOWN");
  const [summaryDraft, setSummaryDraft] = useState({
    conclusion: "INSUFFICIENT_INFORMATION",
    conclusionSummary: "",
    coreTension: "",
    confidence: "",
    industryModuleId: "",
  });
  const [assumptionDraft, setAssumptionDraft] = useState(emptyAssumption);
  const [assumptionOpen, setAssumptionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState("");

  const editable = Boolean(state.data?.report && state.data.report.status === "DRAFT" && canEdit);
  const activeDefinition = researchSectionDefinitions.find((section) => section.code === activeTab);
  const activeSection = useMemo(
    () => state.data?.sections.find((section) => section.code === activeTab) ?? null,
    [activeTab, state.data?.sections],
  );

  function beginSectionEdit() {
    if (!state.data?.report || !activeDefinition) return;
    setSectionContent(activeSection?.content ?? "");
    setSectionKind(activeSection?.claimKind ?? "UNKNOWN");
    setSummaryDraft({
      conclusion: state.data.report.conclusion,
      conclusionSummary: state.data.report.conclusionSummary ?? "",
      coreTension: state.data.report.coreTension ?? "",
      confidence: state.data.report.confidence === null ? "" : String(state.data.report.confidence),
      industryModuleId: state.data.report.industryModuleId ?? "",
    });
    setChangeSummary("");
    setWriteError("");
    setEditing(true);
  }

  async function saveSection() {
    if (!state.data?.report || !activeDefinition || changeSummary.trim().length < 2) {
      setWriteError("请填写至少两个字的变更说明。");
      return;
    }
    const body = {
      conclusion: summaryDraft.conclusion,
      conclusionDate: state.data.report.conclusionDate,
      conclusionSummary: summaryDraft.conclusionSummary || null,
      coreTension: summaryDraft.coreTension || null,
      confidence: summaryDraft.confidence === "" ? null : Number(summaryDraft.confidence),
      industryModuleId: summaryDraft.industryModuleId || null,
      changeSummary: changeSummary.trim(),
      sections: [
        {
          code: activeDefinition.code,
          content: sectionContent || null,
          claimKind: sectionKind,
        },
      ],
    };
    setSaving(true);
    setWriteError("");
    try {
      const response = await fetch(`/api/company-research/${companyId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "保存失败");
      state.setData(payload.data);
      setEditing(false);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function beginAssumptionEdit(id?: string) {
    const item = id ? state.data?.assumptions.find((assumption) => assumption.id === id) : null;
    setAssumptionDraft(
      item
        ? {
            id: item.id,
            title: item.title,
            status: item.status,
            supportEvidence: item.supportEvidence ?? "",
            counterEvidence: item.counterEvidence ?? "",
            verificationMetric: item.verificationMetric ?? "",
            invalidationCondition: item.invalidationCondition ?? "",
            nextReviewAt: item.nextReviewAt ?? "",
            confidence: item.confidence === null ? "" : String(item.confidence),
            claimKind: item.claimKind,
          }
        : emptyAssumption,
    );
    setChangeSummary("");
    setWriteError("");
    setAssumptionOpen(true);
  }

  async function saveAssumption() {
    if (!state.data?.report || !assumptionDraft.title.trim() || changeSummary.trim().length < 2) {
      setWriteError("请填写假设内容与变更说明。");
      return;
    }
    const current = state.data.assumptions.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      supportEvidence: item.supportEvidence,
      counterEvidence: item.counterEvidence,
      verificationMetric: item.verificationMetric,
      invalidationCondition: item.invalidationCondition,
      nextReviewAt: item.nextReviewAt,
      confidence: item.confidence,
      claimKind: item.claimKind,
    }));
    const next = {
      id: assumptionDraft.id,
      title: assumptionDraft.title.trim(),
      status: assumptionDraft.status,
      supportEvidence: assumptionDraft.supportEvidence || null,
      counterEvidence: assumptionDraft.counterEvidence || null,
      verificationMetric: assumptionDraft.verificationMetric || null,
      invalidationCondition: assumptionDraft.invalidationCondition || null,
      nextReviewAt: assumptionDraft.nextReviewAt || null,
      confidence: assumptionDraft.confidence === "" ? null : Number(assumptionDraft.confidence),
      claimKind: assumptionDraft.claimKind,
    };
    const assumptions = assumptionDraft.id
      ? current.map((item) => (item.id === assumptionDraft.id ? next : item))
      : [...current, next];
    setSaving(true);
    setWriteError("");
    try {
      const response = await fetch(`/api/company-research/${companyId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ changeSummary: changeSummary.trim(), assumptions }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "保存失败");
      state.setData(payload.data);
      setAssumptionOpen(false);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function transition(action: "SUBMIT" | "APPROVE" | "RETURN_TO_DRAFT") {
    setSaving(true);
    setWriteError("");
    try {
      const response = await fetch(`/api/company-research/${companyId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "操作失败");
      state.setData(payload.data);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setSaving(false);
    }
  }

  async function createReport() {
    setSaving(true);
    try {
      const response = await fetch("/api/company-research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (!response.ok) throw new Error("创建失败");
      const payload = await response.json();
      state.setData(payload.data);
      router.refresh();
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  if (state.loading) return <LoadingState />;
  if (state.error || !state.data) return <ErrorState retry={state.retry} />;
  const data = state.data;

  if (!data.report) {
    return (
      <main className="page company-research-page">
        <PageHeader
          title={data.company.name}
          description="该公司尚未建立结构化研究档案。"
          actions={
            <Link className="button secondary" href="/company-research">
              <ArrowLeft size={14} /> 返回列表
            </Link>
          }
        />
        <EmptyState
          title={data.databaseAvailable ? "暂无研究档案" : "数据库未接入"}
          description={
            data.databaseAvailable
              ? "建立后可持续更新结论、假设、监控项与历史版本。"
              : "当前环境不会用模拟研究数据替代持久化记录。"
          }
        />
        {canCreate && data.databaseAvailable && (
          <button className="button" disabled={saving} onClick={() => void createReport()} type="button">
            <FilePlus2 size={15} /> 建立研究档案
          </button>
        )}
        {writeError && <p className="company-research-error">{writeError}</p>}
      </main>
    );
  }

  const summaryItems = [
    data.report.coreTension
      ? { label: "核心判断", value: data.report.coreTension.replace(/^历史资料已入库；/, "") }
      : null,
    data.report.confidence !== null
      ? { label: "结论置信度", value: `${data.report.confidence}%`, mono: true }
      : null,
    { label: "估值状态", value: labelFor(data.report.valuationStatus, valuationStatusLabels) },
    { label: "最近更新", value: dateLabel(data.report.updatedAt), mono: true },
  ].filter((item): item is { label: string; value: string; mono?: boolean } => item !== null);
  const visibleSectionContent = sectionExcerpt(activeTab, activeSection?.content ?? null);
  const showSectionEmptyState = activeTab !== "overview"
    && activeTab !== "versions"
    && !visibleSectionContent
    && !(activeTab === "moat" && data.moats.length > 0)
    && !(activeTab === "financial_quality" && data.metrics.length > 0)
    && !(activeTab === "valuation" && data.valuations.length > 0)
    && !(activeTab === "catalysts_risks" && data.observations.length > 0);
  const overviewSummary = data.report.conclusionSummary === "已导入用户提供 PDF 的历史研究结论，需结合当前信息复核。"
    ? "历史结论待复核。"
    : data.report.conclusionSummary ?? "暂无结论摘要";
  const predictability = [
    data.report.predictability3Year,
    data.report.predictability5Year,
    data.report.predictability10Year,
  ];
  const coreMetricCodes = ["REVENUE", "GROSS_MARGIN", "NET_INCOME", "NET_MARGIN"];
  const annualFinancialMetrics = data.metrics.filter(
    (metric) => metric.frequency === "ANNUAL" && coreMetricCodes.includes(metric.code),
  );
  const financialRows = [...annualFinancialMetrics.reduce((rows, metric) => {
    const year = metric.periodEnd?.slice(0, 4);
    if (!year) return rows;
    const row = rows.get(year) ?? { year };
    row[metric.code] = metric;
    rows.set(year, row);
    return rows;
  }, new Map<string, { year: string; [code: string]: string | ResearchMetricRecord }>() ).values()]
    .sort((left, right) => Number(right.year) - Number(left.year));
  const otherFinancialMetrics = data.metrics.filter(
    (metric) => !annualFinancialMetrics.some((item) => item.id === metric.id),
  );

  return (
    <main className="page company-research-page">
      <div className="company-research-back">
        <Link href="/company-research"><ArrowLeft size={14} /> 公司研究</Link>
      </div>
      <PageHeader
        title={data.company.name}
        description={[
          data.company.ticker ? `${data.company.ticker}${data.company.exchange ? ` · ${data.company.exchange}` : ""}` : null,
          data.company.industry,
        ].filter(Boolean).join(" · ")}
        meta={
          <>
            <StatusBadge tone={tone(data.report.conclusion)}>{conclusionLabels[data.report.conclusion]}</StatusBadge>
            {data.report.tags.map((tag) => <StatusBadge key={tag}>{tag}</StatusBadge>)}
          </>
        }
        actions={
          <>
            {editable && !editing && activeDefinition && activeTab !== "assumptions" && (
              <button className="button secondary" onClick={beginSectionEdit} type="button"><Pencil size={14} /> 编辑本节</button>
            )}
            {editable && activeTab === "assumptions" && !assumptionOpen && data.assumptions.length < 7 && (
              <button className="button secondary" onClick={() => beginAssumptionEdit()} type="button"><FilePlus2 size={14} /> 新建假设</button>
            )}
            {canSubmit && data.report.status === "DRAFT" && (
              <button className="button secondary" disabled={saving || editing || assumptionOpen} onClick={() => void transition("SUBMIT")} title={editing || assumptionOpen ? "请先保存或取消当前编辑" : undefined} type="button"><Send size={14} /> 提交审核</button>
            )}
            {canApprove && data.report.status === "PENDING_REVIEW" && (
              <>
                <button className="button secondary" disabled={saving} onClick={() => void transition("RETURN_TO_DRAFT")} type="button"><RotateCcw size={14} /> 退回草稿</button>
                <button className="button" disabled={saving} onClick={() => void transition("APPROVE")} type="button"><ShieldCheck size={14} /> 审核通过</button>
              </>
            )}
          </>
        }
      />

      <section className="company-research-summary">
        {summaryItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong className={item.mono ? "mono" : undefined}>{item.value}</strong>
          </div>
        ))}
      </section>

      <div className="company-research-layout">
        <nav aria-label="公司研究章节" className="company-research-nav">
          {researchSectionDefinitions.map((section) => (
            <button className={activeTab === section.code ? "is-active" : ""} key={section.code} onClick={() => { setActiveTab(section.code); setEditing(false); setAssumptionOpen(false); }} type="button">{section.title}</button>
          ))}
          <button className={activeTab === "versions" ? "is-active" : ""} onClick={() => { setActiveTab("versions"); setEditing(false); }} type="button"><History size={14} /> 历史版本</button>
        </nav>
        <div className="company-research-content">
          {activeTab === "assumptions" ? (
            <SectionCard title="核心假设" eyebrow="3-7 条可验证假设">
              <div className="company-research-assumptions">
                {data.assumptions.map((assumption) => (
                  <article key={assumption.id}>
                    <div>
                      <StatusBadge tone={tone(assumption.claimKind)}>{claimKindLabels[assumption.claimKind]}</StatusBadge>
                      <strong>{assumption.title}</strong>
                      <span>{labelFor(assumption.status, assumptionStatusLabels)}</span>
                    </div>
                    <p><b>支持证据：</b>{assumption.supportEvidence ?? "暂无数据"}</p>
                    <p><b>反对证据：</b>{assumption.counterEvidence ?? "暂无数据"}</p>
                    <dl><div><dt>验证指标</dt><dd>{assumption.verificationMetric ?? "暂无数据"}</dd></div><div><dt>失效条件</dt><dd>{assumption.invalidationCondition ?? "暂无数据"}</dd></div><div><dt>下次检查</dt><dd>{assumption.nextReviewAt ?? "未设置"}</dd></div></dl>
                    {editable && <button className="company-research-inline-action" onClick={() => beginAssumptionEdit(assumption.id)} type="button"><Pencil size={13} /> 编辑</button>}
                  </article>
                ))}
                {!data.assumptions.length && <EmptyState title="暂无核心假设" description="研究结论需要用少量可证伪假设承载，而不是堆叠新闻。" />}
              </div>
              {assumptionOpen && (
                <div className="company-research-editor">
                  <h3>{assumptionDraft.id ? "编辑假设" : "新建假设"}</h3>
                  <label>假设内容<input value={assumptionDraft.title} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, title: event.target.value })} /></label>
                  <div className="company-research-form-grid">
                    <label>状态<input value={assumptionDraft.status} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, status: event.target.value })} /></label>
                    <label>置信度（0-100）<input inputMode="numeric" value={assumptionDraft.confidence} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, confidence: event.target.value })} /></label>
                    <label>下次检查<input type="date" value={assumptionDraft.nextReviewAt} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, nextReviewAt: event.target.value })} /></label>
                    <label>内容类别<select value={assumptionDraft.claimKind} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, claimKind: event.target.value as ResearchClaimKind })}>{claimKindValues.map((kind) => <option key={kind} value={kind}>{claimKindLabels[kind]}</option>)}</select></label>
                  </div>
                  <label>支持证据<ResearchTextarea value={assumptionDraft.supportEvidence} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, supportEvidence: event.target.value })} /></label>
                  <label>反对证据<ResearchTextarea value={assumptionDraft.counterEvidence} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, counterEvidence: event.target.value })} /></label>
                  <label>验证指标<input value={assumptionDraft.verificationMetric} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, verificationMetric: event.target.value })} /></label>
                  <label>失效条件<ResearchTextarea value={assumptionDraft.invalidationCondition} onChange={(event) => setAssumptionDraft({ ...assumptionDraft, invalidationCondition: event.target.value })} /></label>
                  <label>变更说明<input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="例如：补充续费率验证指标" /></label>
                  <div className="company-research-editor-actions"><button className="button secondary" onClick={() => setAssumptionOpen(false)} type="button">取消</button><button className="button" disabled={saving} onClick={() => void saveAssumption()} type="button"><Save size={14} /> 保存假设</button></div>
                </div>
              )}
            </SectionCard>
          ) : activeTab === "versions" ? (
            <SectionCard title="历史版本" eyebrow="每次保存、提交和审核均保留快照">
              <DataTable><table><thead><tr><th>版本</th><th>状态</th><th>变更说明</th><th>时间</th></tr></thead><tbody>{data.versions.map((version) => <tr key={version.id}><td className="mono">v{version.versionNo}</td><td><StatusBadge tone={tone(version.status)}>{labelFor(version.status, reportStatusLabels)}</StatusBadge></td><td>{version.changeSummary}</td><td className="mono">{dateLabel(version.createdAt)}</td></tr>)}</tbody></table></DataTable>
            </SectionCard>
          ) : (
            <SectionCard
              title={activeDefinition?.title ?? "研究内容"}
            >
              {editing ? (
                <div className="company-research-editor">
                  {activeTab === "overview" && <><div className="company-research-form-grid"><label>当前判断<select value={summaryDraft.conclusion} onChange={(event) => setSummaryDraft({ ...summaryDraft, conclusion: event.target.value })}>{researchConclusionValues.map((value) => <option key={value} value={value}>{conclusionLabels[value]}</option>)}</select></label><label>结论置信度<input inputMode="numeric" value={summaryDraft.confidence} onChange={(event) => setSummaryDraft({ ...summaryDraft, confidence: event.target.value })} placeholder="0-100" /></label><label>行业模块<select value={summaryDraft.industryModuleId} onChange={(event) => setSummaryDraft({ ...summaryDraft, industryModuleId: event.target.value })}><option value="">未选择</option>{data.modules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}</select></label></div><label>结论摘要<ResearchTextarea value={summaryDraft.conclusionSummary} onChange={(event) => setSummaryDraft({ ...summaryDraft, conclusionSummary: event.target.value })} /></label><label>核心矛盾<ResearchTextarea value={summaryDraft.coreTension} onChange={(event) => setSummaryDraft({ ...summaryDraft, coreTension: event.target.value })} /></label></>}
                  <label>研究说明<ResearchTextarea className="is-long" value={sectionContent} onChange={(event) => setSectionContent(event.target.value)} placeholder="没有可靠数据时请明确写明待核验或暂无数据。" /></label>
                  <div className="company-research-form-grid"><label>内容类别<select value={sectionKind} onChange={(event) => setSectionKind(event.target.value as ResearchClaimKind)}>{claimKindValues.map((kind) => <option key={kind} value={kind}>{claimKindLabels[kind]}</option>)}</select></label><label>变更说明<input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="例如：补充经营判断" /></label></div>
                  <div className="company-research-editor-actions"><button className="button secondary" onClick={() => setEditing(false)} type="button">取消</button><button className="button" disabled={saving} onClick={() => void saveSection()} type="button"><Save size={14} /> 保存草稿</button></div>
                </div>
              ) : <>
                {activeTab === "overview" && <div className="company-research-conclusion"><h3>{conclusionLabels[data.report.conclusion]}</h3><p>{overviewSummary}</p>{(data.report.competenceAssessment || predictability.some((value) => value !== null)) && <dl>{data.report.competenceAssessment && <div><dt>能力圈</dt><dd>{data.report.competenceAssessment}</dd></div>}{predictability.some((value) => value !== null) && <div><dt>3 / 5 / 10 年可预测性</dt><dd className="mono">{predictability.map((value) => value === null ? "-" : `${value}%`).join(" / ")}</dd></div>}</dl>}</div>}
                {activeTab !== "overview" && visibleSectionContent && <div className="company-research-section-content">{visibleSectionContent}</div>}
                {activeTab !== "overview" && activeSection && <div className="company-research-section-meta"><span>更新于 {dateLabel(activeSection.updatedAt)}</span></div>}
                {showSectionEmptyState && <EmptyState title="暂无内容" description="待补充结构化研究内容。" />}
                {activeTab === "moat" && data.moats.length > 0 && <DataTable><table><thead><tr><th>维度</th><th>强度</th><th>趋势</th><th>证据</th><th>反证</th></tr></thead><tbody>{data.moats.map((moat) => <tr key={moat.id}><td>{moat.moatType}</td><td>{moat.strength ?? "暂无数据"}</td><td>{moat.trend}</td><td>{moat.evidence ?? "暂无数据"}</td><td>{moat.counterEvidence ?? "暂无数据"}</td></tr>)}</tbody></table></DataTable>}
                {activeTab === "financial_quality" && (financialRows.length ? <><DataTable className="company-research-financial-table"><table><thead><tr><th>年度</th><th className="numeric">收入</th><th className="numeric">毛利率</th><th className="numeric">净利润</th><th className="numeric">净利率</th></tr></thead><tbody>{financialRows.map((row) => <tr key={row.year}><td className="mono">{row.year}</td><td className="mono numeric">{formatFinancialMetric(row.REVENUE as ResearchMetricRecord | undefined)}</td><td className="mono numeric">{formatFinancialMetric(row.GROSS_MARGIN as ResearchMetricRecord | undefined)}</td><td className="mono numeric">{formatFinancialMetric(row.NET_INCOME as ResearchMetricRecord | undefined)}</td><td className="mono numeric">{formatFinancialMetric(row.NET_MARGIN as ResearchMetricRecord | undefined)}</td></tr>)}</tbody></table></DataTable>{data.annualReports.length > 0 ? <div className="company-research-annual-links"><span>已核验原始年报</span><div>{data.annualReports.map((annualReport) => <a aria-label={`打开 FY${annualReport.fiscalYear} 年报原文`} href={annualReport.downloadUrl} key={annualReport.id} rel="noreferrer" target="_blank">FY{annualReport.fiscalYear} 原文</a>)}</div></div> : <p className="company-research-annual-note">暂无可直开的已核验年报原文链接。</p>}{otherFinancialMetrics.length > 0 && <details className="company-research-extra-metrics"><summary>其他已录入指标</summary><DataTable><table><thead><tr><th>指标</th><th>数值</th><th>口径</th><th>期间</th></tr></thead><tbody>{otherFinancialMetrics.map((metric) => <tr key={metric.id}><td>{metric.label}{metric.isNormalized && <small> 正常化</small>}</td><td className="mono">{formatMetric(metric.value, metric.unit)}</td><td>{labelFor(metric.valueType, { ACTUAL: "实际", BUDGET: "预算", FORECAST: "预测" })}</td><td className="mono">{metric.periodEnd ?? "暂无数据"}</td></tr>)}</tbody></table></DataTable></details>}</> : <EmptyState title="暂无已核验五年财务数据" description="仅展示能从公开年报口径核验的收入、毛利率、净利润和净利率；缺失数据不会以估算值代替。" />)}
                {activeTab === "valuation" && (data.valuations.length ? <DataTable><table><thead><tr><th>类型</th><th>情景</th><th>价格日期</th><th>状态</th></tr></thead><tbody>{data.valuations.map((valuation) => <tr key={valuation.id}><td>{valuation.method === "PUBLIC_MARKET_REFERENCE" ? "市场参考" : "估值判断"}</td><td>{labelFor(valuation.scenario, { BASE: "基准", BULL: "乐观", BEAR: "谨慎" })}</td><td className="mono">{valuation.priceAsOf ?? "暂无数据"}</td><td>{labelFor(valuation.status, valuationStatusLabels)}</td></tr>)}</tbody></table></DataTable> : <EmptyState title="暂无估值数据" description="待形成可复核的估值判断。" />)}
                {activeTab === "catalysts_risks" && data.observations.length > 0 && <div className="company-research-observations">{data.observations.map((item) => <article key={item.id}><StatusBadge tone={item.observationType === "RISK" ? "warning" : "info"}>{labelFor(item.observationType, observationTypeLabels)}</StatusBadge><strong>{item.title}</strong><p>{item.content ?? "暂无数据"}</p><span>{item.timeWindow ?? "未设时间窗口"}{item.monitorMetric ? ` · ${item.monitorMetric}` : ""}</span></article>)}</div>}
              </>}
            </SectionCard>
          )}
          <SectionCard title="相关动态">
            {data.intelligence.length ? <div className="company-research-intelligence">{data.intelligence.map((item) => <a href={item.originalUrl} key={item.id} rel="noreferrer" target="_blank"><span>{item.categoryName ?? "未分类"}</span><strong>{item.title}</strong><p>{item.summary}</p><small>{item.publishedAt ? dateLabel(item.publishedAt) : "未标注时间"}</small><ChevronRight aria-hidden="true" size={15} /></a>)}</div> : <EmptyState title="暂无相关动态" description="暂无已关联的公司动态。" />}
          </SectionCard>
        </div>
      </div>
      {writeError && <p className="company-research-error">{writeError}</p>}
    </main>
  );
}
