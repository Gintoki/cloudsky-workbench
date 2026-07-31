"use client";

import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Database,
  FileQuestion,
  Newspaper,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { DemoBanner, ErrorState, LoadingState } from "./page-states";
import { useApiData } from "@/lib/client/use-api-data";
import type { AuditRecord, FactRecord, MetricRecord } from "@/lib/domain/types";
import type { AuthUser } from "@/lib/auth/types";

function formatMetric(metric: MetricRecord) {
  if (metric.unit === "%") return `${(metric.value * 100).toFixed(1)}%`;
  return `${metric.value.toLocaleString("zh-CN")} ${metric.unit}`;
}

function timeAgo(value: string) {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1_440) return `${Math.round(minutes / 60)} 小时前`;
  return `${Math.round(minutes / 1_440)} 天前`;
}

export function DashboardView({ user }: { user: AuthUser }) {
  const facts = useApiData<FactRecord[]>("/api/facts");
  const metrics = useApiData<MetricRecord[]>("/api/metrics");
  const canReadAudit =
    user.role === "ADMINISTRATOR" || user.role === "DIRECTOR";
  const audits = useApiData<AuditRecord[]>(
    canReadAudit ? "/api/audit" : "/api/facts",
  );

  if (facts.loading || metrics.loading || audits.loading) return <LoadingState />;
  if (facts.error || metrics.error || audits.error) {
    return (
      <ErrorState
        retry={() => {
          void facts.retry();
          void metrics.retry();
          void audits.retry();
        }}
      />
    );
  }

  const factRows = facts.data ?? [];
  const metricRows = metrics.data ?? [];
  const auditRows = canReadAudit
    ? ((audits.data ?? []) as AuditRecord[])
    : [];
  const pending =
    factRows.filter((item) => item.status === "PENDING_REVIEW").length +
    metricRows.filter((item) => item.status === "PENDING_REVIEW").length;
  const approvedMetrics = metricRows.filter(
    (item) => item.status === "APPROVED",
  );

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">决策工作台</h1>
          <p className="page-description">
            汇总需要行动的审核、经营指标与近期更新；不使用虚构实时行情补位。
          </p>
        </div>
        <div style={{ color: "#778295", fontSize: 11 }}>
          数据权限：{user.role}
        </div>
      </div>
      <DemoBanner />

      <section className="kpi-strip" aria-label="核心概览">
        <div className="kpi">
          <div className="kpi-label">
            待审核内容 <Clock3 size={14} />
          </div>
          <div className="kpi-value">{pending}</div>
          <div className="kpi-note">
            {user.role === "VIEWER" ? "Viewer 不显示未审核内容" : "事实与指标"}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            已批准公司事实 <CheckCircle2 size={14} />
          </div>
          <div className="kpi-value">
            {factRows.filter((item) => item.status === "APPROVED").length}
          </div>
          <div className="kpi-note">当前有效 Demo 记录</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            结构化指标 <Database size={14} />
          </div>
          <div className="kpi-value">{metricRows.length}</div>
          <div className="kpi-note">按当前角色过滤后</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            近期需回复 <FileQuestion size={14} />
          </div>
          <div className="kpi-value">0</div>
          <div className="kpi-note">Q&A 模块将在 Phase 4 开放</div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">决策与审核队列</h2>
              <span className="panel-meta">按紧急程度排序</span>
            </div>
            <ul className="decision-list">
              {pending > 0 ? (
                <>
                  <li className="decision-item">
                    <span className="decision-icon">
                      <Scale size={14} />
                    </span>
                    <div>
                      <div className="decision-title">
                        {pending} 条事实或指标等待审核
                      </div>
                      <div className="decision-note">
                        审核前请核对来源、口径和期间
                      </div>
                    </div>
                    <Link className="button small" href="/facts">
                      进入审核 <ArrowUpRight size={12} />
                    </Link>
                  </li>
                </>
              ) : (
                <li className="decision-item">
                  <span className="decision-icon">
                    <CheckCircle2 size={14} />
                  </span>
                  <div>
                    <div className="decision-title">当前没有待审核内容</div>
                    <div className="decision-note">
                      仅显示当前角色有权查看的队列
                    </div>
                  </div>
                </li>
              )}
              <li className="decision-item">
                <span className="decision-icon">
                  <BriefcaseBusiness size={14} />
                </span>
                <div>
                  <div className="decision-title">融资、并购与战略事项</div>
                  <div className="decision-note">
                    尚未录入真实事项；任务模块启用后在此聚合
                  </div>
                </div>
                <span className="badge draft">空状态</span>
              </li>
              <li className="decision-item">
                <span className="decision-icon">
                  <Newspaper size={14} />
                </span>
                <div>
                  <div className="decision-title">今日行业动态</div>
                  <div className="decision-note">
                    未配置合规 RSS 或数据 API，不展示模拟新闻
                  </div>
                </div>
                <span className="badge draft">待配置</span>
              </li>
            </ul>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">最新经营指标</h2>
              <Link className="button ghost small" href="/metrics">
                查看指标库 <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="panel-body">
              <div className="metric-grid">
                {approvedMetrics.map((metric) => (
                  <div className="metric-tile" key={metric.id}>
                    <div className="metric-name">
                      <span>{metric.name}</span>
                      <span>{metric.periodLabel}</span>
                    </div>
                    <div className="metric-number">{formatMetric(metric)}</div>
                    <div style={{ marginTop: 5 }}>
                      {metric.yoy !== null ? (
                        <span
                          className={`change ${metric.yoy >= 0 ? "positive" : "negative"}`}
                        >
                          YoY {metric.yoy >= 0 ? "+" : ""}
                          {(metric.yoy * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="change" style={{ color: "#778295" }}>
                          无可比期间
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">重点公司与估值变化</h2>
              <span className="panel-meta">Watchlist</span>
            </div>
            <div className="empty-state compact">
              <div>
                <div className="empty-icon">
                  <Scale size={15} />
                </div>
                <div className="empty-title">尚未配置行情适配器</div>
                <div className="empty-text">
                  Phase 2 将先提供 Mock、CSV/Excel 与 Manual Adapter；不会在这里伪造实时价格。
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">最近更新</h2>
              {canReadAudit && (
                <Link className="button ghost small" href="/audit">
                  全部日志
                </Link>
              )}
            </div>
            <div className="panel-body">
              {auditRows.length > 0 ? (
                <ul className="activity-list">
                  {auditRows.slice(0, 6).map((audit) => (
                    <li className="activity-item" key={audit.id}>
                      <div className="activity-title">
                        {audit.actorName} · {audit.action} ·{" "}
                        {audit.resourceTitle}
                      </div>
                      <div className="activity-meta">
                        {timeAgo(audit.createdAt)} · {audit.requestId}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state compact">
                  <div>
                    <div className="empty-icon">
                      <Clock3 size={15} />
                    </div>
                    <div className="empty-title">
                      当前角色不显示审计详情
                    </div>
                    <div className="empty-text">
                      业务内容仍会按权限展示，敏感审计记录仅授权角色可见。
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">快速入口</h2>
            </div>
            <ul className="decision-list">
              <li className="decision-item">
                <span className="decision-icon">
                  <Database size={14} />
                </span>
                <div>
                  <div className="decision-title">公司事实库</div>
                  <div className="decision-note">统一口径与证据来源</div>
                </div>
                <Link className="button small" href="/facts">
                  打开
                </Link>
              </li>
              <li className="decision-item">
                <span className="decision-icon">
                  <Activity size={14} />
                </span>
                <div>
                  <div className="decision-title">指标库</div>
                  <div className="decision-note">实际、预算与预测</div>
                </div>
                <Link className="button small" href="/metrics">
                  打开
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
