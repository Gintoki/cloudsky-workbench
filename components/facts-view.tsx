"use client";

import {
  ArrowDownUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Plus,
  Pencil,
  Send,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useApiData } from "@/lib/client/use-api-data";
import type { FactRecord } from "@/lib/domain/types";
import { DemoBanner, ErrorState, LoadingState } from "./page-states";

const statusLabel: Record<FactRecord["status"], string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  SUPERSEDED: "Superseded",
  ARCHIVED: "Archived",
};

const statusClass: Record<FactRecord["status"], string> = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending",
  APPROVED: "approved",
  SUPERSEDED: "draft",
  ARCHIVED: "draft",
};

export function FactsView({ user }: { user: AuthUser }) {
  const state = useApiData<FactRecord[]>("/api/facts");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FactRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const result = (state.data ?? []).filter(
      (fact) =>
        (category === "ALL" || fact.primaryCategory === category) &&
        (status === "ALL" || fact.status === status) &&
        (!normalized ||
          fact.title.toLocaleLowerCase().includes(normalized) ||
          fact.content.toLocaleLowerCase().includes(normalized) ||
          fact.sourceTitle.toLocaleLowerCase().includes(normalized)),
    );
    return result.sort((a, b) =>
      sortDesc
        ? b.updatedAt.localeCompare(a.updatedAt)
        : a.updatedAt.localeCompare(b.updatedAt),
    );
  }, [category, query, sortDesc, state.data, status]);

  async function transition(
    fact: FactRecord,
    nextStatus: "PENDING_REVIEW" | "APPROVED",
  ) {
    setWorkingId(fact.id);
    try {
      const response = await fetch(`/api/facts/${fact.id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("Transition failed");
      await state.retry();
    } finally {
      setWorkingId(null);
    }
  }

  async function saveFact(
    input: Record<string, string | null>,
    id?: string,
  ) {
    const response = await fetch(id ? `/api/facts/${id}` : "/api/facts", {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message ?? "保存失败");
    }
    setFormOpen(false);
    setEditing(null);
    await state.retry();
  }

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState retry={state.retry} />;

  const categories = [...new Set((state.data ?? []).map((x) => x.primaryCategory))];

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">公司事实库</h1>
          <p className="page-description">
            统一维护事实、数值、统计口径、期间、来源与审核状态。
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button">
            <Download size={13} /> 导出
          </button>
          <button
            className="button primary"
            disabled={!hasPermission(user, "facts.create")}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={13} /> 新建事实
          </button>
        </div>
      </div>
      <DemoBanner />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="搜索公司事实"
            className="field search-field"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、内容或来源"
            value={query}
          />
          <select
            aria-label="按分类筛选"
            className="field"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="ALL">全部分类</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="按状态筛选"
            className="field"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="ALL">全部状态</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
          </select>
          <button className="button small">
            <Filter size={12} /> 保存视图
          </button>
          <button
            className="button small"
            onClick={() => setSortDesc((value) => !value)}
          >
            <ArrowDownUp size={12} /> {sortDesc ? "最近更新" : "最早更新"}
          </button>
          <div className="toolbar-spacer" />
          <button className="button small" disabled={selected.size === 0}>
            批量操作 ({selected.size})
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <div>
              <div className="empty-icon">
                <FileText size={15} />
              </div>
              <div className="empty-title">没有符合条件的事实</div>
              <div className="empty-text">
                调整搜索或筛选条件。系统不会用其他状态的数据补充空结果。
              </div>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      aria-label="选择当前列表"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? new Set(rows.map((row) => row.id))
                            : new Set(),
                        )
                      }
                      type="checkbox"
                    />
                  </th>
                  <th>事实与口径</th>
                  <th>分类</th>
                  <th>所属期间</th>
                  <th>来源</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>版本</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((fact) => (
                  <tr key={fact.id}>
                    <td>
                      <input
                        aria-label={`选择 ${fact.title}`}
                        checked={selected.has(fact.id)}
                        onChange={(event) => {
                          const next = new Set(selected);
                          if (event.target.checked) next.add(fact.id);
                          else next.delete(fact.id);
                          setSelected(next);
                        }}
                        type="checkbox"
                      />
                    </td>
                    <td>
                      <div className="cell-title">{fact.title}</div>
                      <div className="cell-subtitle">{fact.measurementBasis}</div>
                    </td>
                    <td>
                      <div>{fact.primaryCategory}</div>
                      <div className="cell-subtitle">
                        {fact.secondaryCategory ?? "—"}
                      </div>
                    </td>
                    <td>{fact.periodLabel ?? "长期有效"}</td>
                    <td>
                      <div className="cell-title">{fact.sourceTitle}</div>
                      <div className="cell-subtitle">
                        {fact.sourceQuote ?? "无原文摘录"}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusClass[fact.status]}`}>
                        {statusLabel[fact.status]}
                      </span>
                    </td>
                    <td>{fact.ownerName}</td>
                    <td className="mono">v{fact.versionNo}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        {fact.status === "DRAFT" &&
                          hasPermission(user, "facts.submit") && (
                            <>
                              <button
                                className="button small"
                                onClick={() => {
                                  setEditing(fact);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil size={11} /> 编辑
                              </button>
                              <button
                                className="button small"
                                disabled={workingId === fact.id}
                                onClick={() =>
                                  void transition(fact, "PENDING_REVIEW")
                                }
                              >
                                <Send size={11} /> 送审
                              </button>
                            </>
                          )}
                        {fact.status === "PENDING_REVIEW" &&
                          hasPermission(user, "facts.approve") && (
                            <button
                              className="button small"
                              disabled={workingId === fact.id}
                              onClick={() =>
                                void transition(fact, "APPROVED")
                              }
                            >
                              <Check size={11} /> 批准
                            </button>
                          )}
                        {(fact.status === "APPROVED" ||
                          user.role === "VIEWER") && (
                          <button className="button small">查看</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            显示 {rows.length} / {(state.data ?? []).length} 条记录
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <button aria-label="上一页" className="icon-button" disabled>
              <ChevronLeft size={13} />
            </button>
            <button aria-label="下一页" className="icon-button" disabled>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>
      {formOpen && (
        <FactForm
          fact={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={saveFact}
        />
      )}
    </main>
  );
}

function FactForm({
  fact,
  onClose,
  onSave,
}: {
  fact: FactRecord | null;
  onClose: () => void;
  onSave: (
    input: Record<string, string | null>,
    id?: string,
  ) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await onSave(
        {
          primaryCategory: String(form.get("primaryCategory") ?? ""),
          secondaryCategory: String(form.get("secondaryCategory") ?? "") || null,
          title: String(form.get("title") ?? ""),
          content: String(form.get("content") ?? ""),
          numericValue: String(form.get("numericValue") ?? "") || null,
          unit: String(form.get("unit") ?? "") || null,
          measurementBasis: String(form.get("measurementBasis") ?? ""),
          periodLabel: String(form.get("periodLabel") ?? "") || null,
          sourceTitle: String(form.get("sourceTitle") ?? ""),
          sourceQuote: String(form.get("sourceQuote") ?? "") || null,
        },
        fact?.id,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside
        aria-label={fact ? "编辑公司事实" : "新建公司事实"}
        className="drawer"
      >
        <div className="drawer-header">
          <div>
            <h2>{fact ? "编辑公司事实" : "新建公司事实"}</h2>
            <p>保存后生成 Draft 和不可变版本快照。</p>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <form className="drawer-form" onSubmit={submit}>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="primaryCategory">一级分类 *</label>
              <select
                className="form-input"
                defaultValue={fact?.primaryCategory ?? "公司概况"}
                id="primaryCategory"
                name="primaryCategory"
              >
                {[
                  "公司概况",
                  "股权与融资",
                  "财务数据",
                  "客户",
                  "合同与订单",
                  "产品",
                  "技术",
                  "算力资源",
                  "节点网络",
                  "海外业务",
                  "竞争格局",
                  "合规与上市",
                  "管理团队",
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="secondaryCategory">二级分类</label>
              <input
                className="form-input"
                defaultValue={fact?.secondaryCategory ?? ""}
                id="secondaryCategory"
                name="secondaryCategory"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="title">事实标题 *</label>
            <input
              className="form-input"
              defaultValue={fact?.title ?? ""}
              id="title"
              minLength={3}
              name="title"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">事实内容 *</label>
            <textarea
              className="form-textarea"
              defaultValue={fact?.content ?? ""}
              id="content"
              minLength={10}
              name="content"
              required
              rows={5}
            />
          </div>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="numericValue">数值</label>
              <input
                className="form-input"
                defaultValue={fact?.numericValue ?? ""}
                id="numericValue"
                name="numericValue"
                placeholder="可选"
              />
            </div>
            <div className="form-group">
              <label htmlFor="unit">单位</label>
              <input
                className="form-input"
                defaultValue={fact?.unit ?? ""}
                id="unit"
                name="unit"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="measurementBasis">统计口径 *</label>
            <textarea
              className="form-textarea"
              defaultValue={fact?.measurementBasis ?? ""}
              id="measurementBasis"
              minLength={3}
              name="measurementBasis"
              required
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="periodLabel">数据所属期间</label>
            <input
              className="form-input"
              defaultValue={fact?.periodLabel ?? ""}
              id="periodLabel"
              name="periodLabel"
              placeholder="例如：2026 Q2"
            />
          </div>
          <div className="form-group">
            <label htmlFor="sourceTitle">信息来源 *</label>
            <input
              className="form-input"
              defaultValue={fact?.sourceTitle ?? ""}
              id="sourceTitle"
              minLength={3}
              name="sourceTitle"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="sourceQuote">原文引用</label>
            <textarea
              className="form-textarea"
              defaultValue={fact?.sourceQuote ?? ""}
              id="sourceQuote"
              name="sourceQuote"
              rows={3}
            />
          </div>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}
          <div className="drawer-actions">
            <button className="button" onClick={onClose} type="button">
              取消
            </button>
            <button className="button primary" disabled={saving} type="submit">
              {saving ? "正在保存…" : "保存 Draft"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
