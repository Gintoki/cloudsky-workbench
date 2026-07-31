"use client";

import {
  ArrowDownUp,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useApiData } from "@/lib/client/use-api-data";
import type { MetricRecord } from "@/lib/domain/types";
import { DemoBanner, ErrorState, LoadingState } from "./page-states";

function valueText(metric: MetricRecord) {
  if (metric.unit === "%") return `${(metric.value * 100).toFixed(1)}%`;
  return `${metric.value.toLocaleString("zh-CN")} ${metric.unit}`;
}

function changeText(value: number | null) {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

export function MetricsView({ user }: { user: AuthUser }) {
  const state = useApiData<MetricRecord[]>("/api/metrics");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [frequency, setFrequency] = useState("ALL");
  const [sortDesc, setSortDesc] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MetricRecord | null>(null);

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return (state.data ?? [])
      .filter(
        (metric) =>
          (type === "ALL" || metric.valueType === type) &&
          (frequency === "ALL" || metric.frequency === frequency) &&
          (!normalized ||
            metric.name.toLocaleLowerCase().includes(normalized) ||
            metric.code.toLocaleLowerCase().includes(normalized)),
      )
      .sort((a, b) =>
        sortDesc
          ? b.updatedAt.localeCompare(a.updatedAt)
          : a.updatedAt.localeCompare(b.updatedAt),
      );
  }, [frequency, query, sortDesc, state.data, type]);

  async function saveMetric(
    input: Record<string, string | number>,
    id?: string,
  ) {
    const response = await fetch(id ? `/api/metrics/${id}` : "/api/metrics", {
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

  const approved = (state.data ?? []).filter(
    (metric) => metric.status === "APPROVED",
  );

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">指标库</h1>
          <p className="page-description">
            结构化维护实际、预算与预测值，明确情景、频率、口径和来源。
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="button">
            <Upload size={13} /> Excel / CSV 导入
          </button>
          <button className="button">
            <Download size={13} /> 导出
          </button>
          <button
            className="button primary"
            disabled={!hasPermission(user, "metrics.create")}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={13} /> 新增指标值
          </button>
        </div>
      </div>
      <DemoBanner />

      <section className="kpi-strip" aria-label="指标摘要">
        {approved.slice(0, 4).map((metric) => (
          <div className="kpi" key={metric.id}>
            <div className="kpi-label">
              {metric.name}
              <span>{metric.periodLabel}</span>
            </div>
            <div className="kpi-value" style={{ fontSize: 20 }}>
              {valueText(metric)}
            </div>
            <div className="kpi-note">
              YoY {changeText(metric.yoy)} · QoQ {changeText(metric.qoq)}
            </div>
          </div>
        ))}
        {approved.length === 0 && (
          <div className="empty-state compact" style={{ gridColumn: "1 / -1" }}>
            没有当前角色可见的 Approved 指标。
          </div>
        )}
      </section>

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="搜索指标"
            className="field search-field"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索指标名称或代码"
            value={query}
          />
          <select
            aria-label="按数值类型筛选"
            className="field"
            onChange={(event) => setType(event.target.value)}
            value={type}
          >
            <option value="ALL">全部类型</option>
            <option value="ACTUAL">Actual</option>
            <option value="BUDGET">Budget</option>
            <option value="FORECAST">Forecast</option>
          </select>
          <select
            aria-label="按频率筛选"
            className="field"
            onChange={(event) => setFrequency(event.target.value)}
            value={frequency}
          >
            <option value="ALL">全部频率</option>
            <option value="MONTHLY">月度</option>
            <option value="QUARTERLY">季度</option>
            <option value="ANNUAL">年度</option>
          </select>
          <button
            className="button small"
            onClick={() => setSortDesc((value) => !value)}
          >
            <ArrowDownUp size={12} /> {sortDesc ? "最近更新" : "最早更新"}
          </button>
          <div className="toolbar-spacer" />
          <span className="panel-meta">口径与来源为必填项</span>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <div>
              <div className="empty-icon">
                <FileSpreadsheet size={15} />
              </div>
              <div className="empty-title">没有符合条件的指标值</div>
              <div className="empty-text">
                调整筛选条件，或由有权限的用户导入结构化指标。
              </div>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>指标</th>
                  <th>期间</th>
                  <th>数值</th>
                  <th>类型 / 情景</th>
                  <th>频率</th>
                  <th>YoY</th>
                  <th>QoQ</th>
                  <th>来源与口径</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((metric) => (
                  <tr key={metric.id}>
                    <td>
                      <div className="cell-title">{metric.name}</div>
                      <div className="cell-subtitle mono">{metric.code}</div>
                    </td>
                    <td>{metric.periodLabel}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {valueText(metric)}
                    </td>
                    <td>
                      <span
                        className={`badge ${metric.valueType === "FORECAST" ? "forecast" : "draft"}`}
                      >
                        {metric.valueType}
                      </span>{" "}
                      <span className="badge">{metric.scenario}</span>
                    </td>
                    <td>{metric.frequency}</td>
                    <td
                      className={`change ${metric.yoy !== null && metric.yoy >= 0 ? "positive" : "negative"}`}
                    >
                      {changeText(metric.yoy)}
                    </td>
                    <td
                      className={`change ${metric.qoq !== null && metric.qoq >= 0 ? "positive" : "negative"}`}
                    >
                      {changeText(metric.qoq)}
                    </td>
                    <td>
                      <div className="cell-title">{metric.sourceTitle}</div>
                      <div className="cell-subtitle">
                        {metric.measurementBasis}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          metric.status === "APPROVED"
                            ? "approved"
                            : metric.status === "PENDING_REVIEW"
                              ? "pending"
                              : "draft"
                        }`}
                      >
                        {metric.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {metric.status === "DRAFT" &&
                      hasPermission(user, "metrics.update") ? (
                        <button
                          className="button small"
                          onClick={() => {
                            setEditing(metric);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil size={11} /> 编辑
                        </button>
                      ) : (
                        <button className="button small">查看</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>显示 {rows.length} 条结构化指标值</span>
          <span>导入支持 Dry Run 与逐行错误报告（接口预留）</span>
        </div>
      </section>
      {formOpen && (
        <MetricForm
          metric={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={saveMetric}
        />
      )}
    </main>
  );
}

function MetricForm({
  metric,
  onClose,
  onSave,
}: {
  metric: MetricRecord | null;
  onClose: () => void;
  onSave: (
    input: Record<string, string | number>,
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
          code: String(form.get("code") ?? "").toUpperCase(),
          name: String(form.get("name") ?? ""),
          periodLabel: String(form.get("periodLabel") ?? ""),
          periodStart: String(form.get("periodStart") ?? ""),
          periodEnd: String(form.get("periodEnd") ?? ""),
          value: Number(form.get("value")),
          unit: String(form.get("unit") ?? ""),
          valueType: String(form.get("valueType") ?? "ACTUAL"),
          scenario: String(form.get("scenario") ?? "BASE"),
          frequency: String(form.get("frequency") ?? "QUARTERLY"),
          measurementBasis: String(form.get("measurementBasis") ?? ""),
          sourceTitle: String(form.get("sourceTitle") ?? ""),
        },
        metric?.id,
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
        aria-label={metric ? "编辑指标值" : "新增指标值"}
        className="drawer"
      >
        <div className="drawer-header">
          <div>
            <h2>{metric ? "编辑指标值" : "新增指标值"}</h2>
            <p>数值将以 Draft 保存，审核后才会成为正式口径。</p>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <form className="drawer-form" onSubmit={submit}>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="code">指标代码 *</label>
              <input
                className="form-input mono"
                defaultValue={metric?.code ?? ""}
                id="code"
                name="code"
                pattern="[A-Z0-9_]+"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">指标名称 *</label>
              <input
                className="form-input"
                defaultValue={metric?.name ?? ""}
                id="name"
                name="name"
                required
              />
            </div>
          </div>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="value">数值 *</label>
              <input
                className="form-input"
                defaultValue={metric?.value ?? ""}
                id="value"
                name="value"
                required
                step="any"
                type="number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="unit">单位 *</label>
              <input
                className="form-input"
                defaultValue={metric?.unit ?? ""}
                id="unit"
                name="unit"
                required
              />
            </div>
          </div>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="periodLabel">期间标签 *</label>
              <input
                className="form-input"
                defaultValue={metric?.periodLabel ?? ""}
                id="periodLabel"
                name="periodLabel"
                placeholder="例如：2026 Q2"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="frequency">频率 *</label>
              <select
                className="form-input"
                defaultValue={metric?.frequency ?? "QUARTERLY"}
                id="frequency"
                name="frequency"
              >
                <option value="MONTHLY">月度</option>
                <option value="QUARTERLY">季度</option>
                <option value="ANNUAL">年度</option>
              </select>
            </div>
          </div>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="periodStart">开始日期 *</label>
              <input
                className="form-input"
                defaultValue={metric?.periodStart ?? ""}
                id="periodStart"
                name="periodStart"
                required
                type="date"
              />
            </div>
            <div className="form-group">
              <label htmlFor="periodEnd">结束日期 *</label>
              <input
                className="form-input"
                defaultValue={metric?.periodEnd ?? ""}
                id="periodEnd"
                name="periodEnd"
                required
                type="date"
              />
            </div>
          </div>
          <div className="form-grid two">
            <div className="form-group">
              <label htmlFor="valueType">数值类型 *</label>
              <select
                className="form-input"
                defaultValue={metric?.valueType ?? "ACTUAL"}
                id="valueType"
                name="valueType"
              >
                <option value="ACTUAL">Actual</option>
                <option value="BUDGET">Budget</option>
                <option value="FORECAST">Forecast</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="scenario">情景 *</label>
              <select
                className="form-input"
                defaultValue={metric?.scenario ?? "BASE"}
                id="scenario"
                name="scenario"
              >
                <option value="BEAR">Bear</option>
                <option value="BASE">Base</option>
                <option value="BULL">Bull</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="measurementBasis">指标口径 *</label>
            <textarea
              className="form-textarea"
              defaultValue={metric?.measurementBasis ?? ""}
              id="measurementBasis"
              minLength={3}
              name="measurementBasis"
              required
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="sourceTitle">信息来源 *</label>
            <input
              className="form-input"
              defaultValue={metric?.sourceTitle ?? ""}
              id="sourceTitle"
              name="sourceTitle"
              required
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
