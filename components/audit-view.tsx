"use client";

import { Download, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { useApiData } from "@/lib/client/use-api-data";
import type { AuditRecord } from "@/lib/domain/types";
import { DemoBanner, ErrorState, LoadingState } from "./page-states";

const actionLabels: Record<string, string> = {
  APPROVE: "审核通过",
  SUBMIT_REVIEW: "提交审核",
  UPDATE: "修改",
  CREATE: "新建",
  LOGIN: "登录",
};

export function AuditView() {
  const state = useApiData<AuditRecord[]>("/api/audit");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const normalized = query.toLocaleLowerCase();
    return (state.data ?? []).filter(
      (item) =>
        !normalized ||
        item.actorName.toLocaleLowerCase().includes(normalized) ||
        item.resourceTitle.toLocaleLowerCase().includes(normalized) ||
        item.requestId.toLocaleLowerCase().includes(normalized),
    );
  }, [query, state.data]);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState retry={state.retry} />;

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">审计日志</h1>
          <p className="page-description">
            只读追踪关键业务与安全操作；业务用户不能修改或删除。
          </p>
        </div>
        <button className="button">
          <Download size={13} /> 导出审计记录
        </button>
      </div>
      <DemoBanner />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="搜索审计日志"
            className="field search-field"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索用户、资源或请求 ID"
            value={query}
          />
          <select aria-label="按资源筛选" className="field">
            <option>全部资源</option>
            <option>COMPANY_FACT</option>
            <option>METRIC_VALUE</option>
          </select>
          <select aria-label="按动作筛选" className="field">
            <option>全部动作</option>
            <option>APPROVE</option>
            <option>SUBMIT_REVIEW</option>
            <option>UPDATE</option>
          </select>
          <div className="toolbar-spacer" />
          <span className="panel-meta">按时间倒序 · 最多显示 100 条</span>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <div>
              <div className="empty-icon">
                <ScrollText size={15} />
              </div>
              <div className="empty-title">没有符合条件的审计记录</div>
              <div className="empty-text">调整筛选条件后重试。</div>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作人</th>
                  <th>动作</th>
                  <th>资源类型</th>
                  <th>资源</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((audit) => (
                  <tr key={audit.id}>
                    <td className="mono">
                      {new Intl.DateTimeFormat("zh-CN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Shanghai",
                      }).format(new Date(audit.createdAt))}
                    </td>
                    <td>{audit.actorName}</td>
                    <td>
                      <span className="badge">
                        {actionLabels[audit.action] ?? audit.action}
                      </span>
                    </td>
                    <td>{audit.resourceType}</td>
                    <td className="cell-title">{audit.resourceTitle}</td>
                    <td className="mono">{audit.requestId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>共 {rows.length} 条记录</span>
          <span>日志为追加写入</span>
        </div>
      </section>
    </main>
  );
}
