"use client";

import { CalendarClock, ExternalLink, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useApiData } from "@/lib/client/use-api-data";
import {
  investorStageLabels,
  investorTypeLabels,
  investorVisibilityLabels,
  type InvestorAccountRecord,
  type InvestorCrmData,
} from "@/lib/investor-relations/types";
import { ErrorState, LoadingState } from "./page-states";
import { DataTable, EmptyState, PageHeader, SectionCard, StatusBadge } from "./ui/workbench-primitives";

function dateLabel(value: string | null) {
  if (!value) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function stageTone(stage: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (stage === "ACTIVE") return "success";
  if (stage === "DILIGENCE") return "info";
  if (stage === "ENGAGED") return "warning";
  if (stage === "DECLINED") return "danger";
  return "neutral";
}

function emptyValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function InvestorCrmView({ canCreate, canUpdate }: { canCreate: boolean; canUpdate: boolean }) {
  const state = useApiData<InvestorCrmData>("/api/investor-crm");
  const [formOpen, setFormOpen] = useState(false);
  const [contactFor, setContactFor] = useState<InvestorAccountRecord | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState("");

  const accounts = useMemo(() => {
    const items = state.data?.accounts ?? [];
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((account) =>
      [account.name, account.focus, account.geography, ...account.contacts.map((contact) => contact.name)]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [query, state.data?.accounts]);

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contactName = emptyValue(form.get("contactName"));
    setSaving(true);
    setWriteError("");
    try {
      const response = await fetch("/api/investor-crm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: emptyValue(form.get("name")),
          investorType: form.get("investorType"),
          relationshipStage: form.get("relationshipStage"),
          focus: emptyValue(form.get("focus")),
          geography: emptyValue(form.get("geography")),
          website: emptyValue(form.get("website")),
          visibility: form.get("visibility"),
          nextAction: emptyValue(form.get("nextAction")),
          nextActionAt: emptyValue(form.get("nextActionAt")),
          notes: emptyValue(form.get("notes")),
          primaryContact: contactName
            ? {
                name: contactName,
                title: emptyValue(form.get("contactTitle")),
                email: emptyValue(form.get("contactEmail")),
                phone: emptyValue(form.get("contactPhone")),
                wechat: emptyValue(form.get("contactWechat")),
              }
            : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "新增机构失败。");
      setFormOpen(false);
      await state.retry();
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "新增机构失败。");
    } finally {
      setSaving(false);
    }
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactFor) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setWriteError("");
    try {
      const response = await fetch(`/api/investor-crm/${contactFor.id}/contacts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: emptyValue(form.get("name")),
          title: emptyValue(form.get("title")),
          email: emptyValue(form.get("email")),
          phone: emptyValue(form.get("phone")),
          wechat: emptyValue(form.get("wechat")),
          notes: emptyValue(form.get("notes")),
          isPrimary: form.get("isPrimary") === "on",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "新增联系人失败。");
      setContactFor(null);
      await state.retry();
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "新增联系人失败。");
    } finally {
      setSaving(false);
    }
  }

  if (state.loading) return <LoadingState />;
  if (state.error || !state.data) return <ErrorState retry={state.retry} />;

  return (
    <main className="page investor-crm-page">
      <PageHeader
        title="投资人 CRM"
        description="机构、联系人、互动与下一步行动统一留存在当前工作台。"
        meta={<StatusBadge tone={state.data.databaseAvailable ? "success" : "warning"}>{state.data.databaseAvailable ? "数据库已连接" : "数据库未接入"}</StatusBadge>}
        actions={canCreate ? <button className="button" onClick={() => { setFormOpen(true); setWriteError(""); }} type="button"><Plus size={15} /> 新建机构</button> : undefined}
      />

      {formOpen && (
        <SectionCard title="新建投资人机构" eyebrow="机构与首要联系人">
          <form className="investor-form" onSubmit={(event) => void submitAccount(event)}>
            <div className="investor-form-grid">
              <label>机构名称<input name="name" required /></label>
              <label>投资人类型<select defaultValue="INSTITUTION" name="investorType">{Object.entries(investorTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>关系阶段<select defaultValue="TARGET" name="relationshipStage">{Object.entries(investorStageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>可见范围<select defaultValue="TEAM" name="visibility">{Object.entries(investorVisibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>投资偏好<input name="focus" placeholder="例如：成长股、AI 基础设施" /></label>
              <label>地域<input name="geography" placeholder="例如：上海 / 香港" /></label>
              <label>官网<input name="website" placeholder="https://" type="url" /></label>
              <label>下一步行动<input name="nextAction" placeholder="例如：发送季度更新" /></label>
              <label>行动日期<input name="nextActionAt" type="date" /></label>
            </div>
            <label>机构备注<textarea name="notes" placeholder="仅记录已知、可追溯的沟通信息。" /></label>
            <div className="investor-form-divider">首要联系人（可选）</div>
            <div className="investor-form-grid">
              <label>姓名<input name="contactName" /></label>
              <label>职位<input name="contactTitle" /></label>
              <label>邮箱<input name="contactEmail" type="email" /></label>
              <label>电话<input name="contactPhone" /></label>
              <label>微信<input name="contactWechat" /></label>
            </div>
            <div className="investor-form-actions"><button className="button secondary" onClick={() => setFormOpen(false)} type="button">取消</button><button className="button" disabled={saving} type="submit">保存机构</button></div>
          </form>
        </SectionCard>
      )}

      {contactFor && (
        <SectionCard title={`新增联系人 · ${contactFor.name}`}>
          <form className="investor-form" onSubmit={(event) => void submitContact(event)}>
            <div className="investor-form-grid">
              <label>姓名<input name="name" required /></label>
              <label>职位<input name="title" /></label>
              <label>邮箱<input name="email" type="email" /></label>
              <label>电话<input name="phone" /></label>
              <label>微信<input name="wechat" /></label>
            </div>
            <label>联系人备注<textarea name="notes" /></label>
            <label className="investor-checkbox"><input name="isPrimary" type="checkbox" /> 设为首要联系人</label>
            <div className="investor-form-actions"><button className="button secondary" onClick={() => setContactFor(null)} type="button">取消</button><button className="button" disabled={saving} type="submit">保存联系人</button></div>
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="机构列表"
        action={<input aria-label="搜索投资人机构" className="investor-search" onChange={(event) => setQuery(event.target.value)} placeholder="搜索机构或联系人" value={query} />}
      >
        {accounts.length ? (
          <DataTable className="investor-table-wrap"><table><thead><tr><th>机构</th><th>联系人</th><th>阶段</th><th className="numeric">路演</th><th>最近互动</th><th>下一步行动</th><th aria-label="操作" /></tr></thead><tbody>{accounts.map((account) => {
            const primary = account.contacts[0];
            return <tr key={account.id}><td><strong>{account.name}</strong><small>{[investorTypeLabels[account.investorType], account.focus, account.geography].filter(Boolean).join(" · ")}</small><small>{investorVisibilityLabels[account.visibility]}</small></td><td>{primary ? <><strong>{primary.name}</strong><small>{[primary.title, primary.email].filter(Boolean).join(" · ")}</small></> : <span className="muted">暂无联系人</span>}</td><td><StatusBadge tone={stageTone(account.relationshipStage)}>{investorStageLabels[account.relationshipStage] ?? account.relationshipStage}</StatusBadge></td><td className="mono numeric">{account.roadshowCount}</td><td className="mono">{dateLabel(account.latestRoadshowAt ?? account.lastInteractionAt)}</td><td>{account.nextAction ? <><strong>{account.nextAction}</strong><small>{account.nextActionAt ? `截止 ${account.nextActionAt}` : "未设日期"}</small></> : <span className="muted">暂无</span>}</td><td><div className="investor-row-actions">{canUpdate && <button aria-label={`为 ${account.name} 新增联系人`} className="os-icon-button" onClick={() => { setContactFor(account); setWriteError(""); }} title="新增联系人" type="button"><UserPlus size={15} /></button>}<Link aria-label={`查看 ${account.name} 的路演记录`} className="os-icon-button" href="/roadshows" title="查看路演"><CalendarClock size={15} /></Link>{account.website && <a aria-label={`打开 ${account.name} 官网`} className="os-icon-button" href={account.website} rel="noreferrer" target="_blank" title="打开官网"><ExternalLink size={15} /></a>}</div></td></tr>;
          })}</tbody></table></DataTable>
        ) : (
          <EmptyState title={query ? "没有匹配的机构" : "暂无投资人机构"} description={query ? "请调整搜索关键词。" : "从首个机构和联系人开始，路演记录会自动归集到该机构。"} />
        )}
      </SectionCard>
      {writeError && <p className="investor-write-error">{writeError}</p>}
    </main>
  );
}
