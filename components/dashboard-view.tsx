"use client";

import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  ListTodo,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { useApiData } from "@/lib/client/use-api-data";
import type {
  AuditRecord,
  ComparableMarketDataResult,
  FactRecord,
  IntelligenceListResult,
  MetricRecord,
} from "@/lib/domain/types";
import { investorStageLabels, type InvestorCrmData } from "@/lib/investor-relations/types";
import { comparableUniverse } from "@/lib/market-data/coverage-universe";
import {
  formatComparableDate,
  formatComparablePrice,
  formatComparableScale,
  getPriceSales,
  marketLabel,
} from "@/lib/market-data/formatters";
import {
  DataTable,
  EmptyState,
  MetricCard,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from "./ui/workbench-primitives";

type ComparableSort = "MARKET_CAP" | "CHANGE" | "PS";
type MarketFilter = "ALL" | "US" | "CN" | "HK";
type MetricMode = MetricRecord["valueType"];

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "暂无数据";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无数据";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatMetric(metric: MetricRecord) {
  if (metric.unit === "%") return `${(metric.value * 100).toFixed(1)}%`;
  return `${metric.value.toLocaleString("zh-CN")} ${metric.unit}`;
}

function formatFactValue(fact: FactRecord | undefined) {
  if (!fact?.numericValue) return "暂无数据";
  return `${fact.numericValue}${fact.unit ? ` ${fact.unit}` : ""}`;
}

function formatRelative(value: string) {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1_440) return `${Math.round(minutes / 60)} 小时前`;
  return `${Math.round(minutes / 1_440)} 天前`;
}

function DashboardSkeleton() {
  return (
    <main className="os-command-page" aria-label="正在加载 Command Center">
      <div className="os-loading-header">
        <Skeleton className="os-skeleton-title" />
        <Skeleton className="os-skeleton-copy" />
      </div>
      <div className="os-kpi-grid">
        {Array.from({ length: 4 }, (_, index) => <Skeleton className="os-skeleton-card" key={index} />)}
      </div>
      <div className="os-dashboard-grid os-dashboard-grid-primary">
        <Skeleton className="os-skeleton-panel" />
        <Skeleton className="os-skeleton-panel" />
      </div>
    </main>
  );
}

export function DashboardView({ user }: { user: AuthUser }) {
  const [marketRequest, setMarketRequest] = useState(0);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [marketSort, setMarketSort] = useState<ComparableSort>("MARKET_CAP");
  const [marketQuery, setMarketQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [metricMode, setMetricMode] = useState<MetricMode>("ACTUAL");
  const facts = useApiData<FactRecord[]>("/api/facts");
  const metrics = useApiData<MetricRecord[]>("/api/metrics");
  const intelligence = useApiData<IntelligenceListResult>(
    "/api/intelligence?sort=newest",
  );
  const comparableMarketData = useApiData<ComparableMarketDataResult>(
    `/api/market-data/comparables${
      marketRequest ? `?refresh=1&request=${marketRequest}` : ""
    }`,
  );
  const canReadAudit = user.role === "ADMINISTRATOR" || user.role === "DIRECTOR";
  const canReadInvestor = user.role !== "VIEWER";
  const audits = useApiData<AuditRecord[]>(
    canReadAudit ? "/api/audit" : "/api/facts",
  );
  const investorCrm = useApiData<InvestorCrmData>(
    canReadInvestor ? "/api/investor-crm" : "/api/facts",
  );

  const isLoading = facts.loading || metrics.loading || intelligence.loading || audits.loading || (canReadInvestor && investorCrm.loading);
  const hasError = facts.error || metrics.error || intelligence.error || audits.error || (canReadInvestor && investorCrm.error);

  if (isLoading) return <DashboardSkeleton />;

  if (hasError) {
    return (
      <main className="os-command-page">
        <SectionCard title="Command Center" eyebrow="数据状态">
          <EmptyState
            description="部分核心数据暂时不可用，系统没有使用缓存或模拟数据替代结果。"
            title="数据加载失败"
          />
        </SectionCard>
      </main>
    );
  }

  const factRows = facts.data ?? [];
  const metricRows = metrics.data ?? [];
  const intelligenceRows = intelligence.data?.items ?? [];
  const categories = intelligence.data?.categories ?? [];
  const auditRows = canReadAudit ? ((audits.data ?? []) as AuditRecord[]) : [];
  const investorAccounts = canReadInvestor ? investorCrm.data?.accounts ?? [] : [];
  const comparableByTicker = new Map(
    (comparableMarketData.data?.items ?? []).map((item) => [item.ticker, item]),
  );
  const approvedMetrics = metricRows.filter((item) => item.status === "APPROVED");
  const pendingFacts = factRows.filter((item) => item.status === "PENDING_REVIEW");
  const pendingMetrics = metricRows.filter((item) => item.status === "PENDING_REVIEW");
  const pendingCount = pendingFacts.length + pendingMetrics.length;
  const valuationFact = factRows.find(
    (item) =>
      item.status === "APPROVED" &&
      /估值|融资|市值/.test(`${item.primaryCategory} ${item.title}`) &&
      item.numericValue,
  );
  const contractFact = factRows.find(
    (item) =>
      item.status === "APPROVED" &&
      /订单|合同|在手/.test(`${item.primaryCategory} ${item.title}`) &&
      item.numericValue,
  );
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const weeklyIntelligenceCount = intelligenceRows.filter(
    (item) => new Date(item.publishedAt).getTime() >= startOfWeek.getTime(),
  ).length;
  const activeStream =
    activeCategory === "ALL"
      ? intelligenceRows
      : intelligenceRows.filter((item) => item.categorySlug === activeCategory);
  const visibleMetrics = approvedMetrics.filter((item) => item.valueType === metricMode);
  const comparableRows = comparableUniverse
    .map((security) => ({ security, record: comparableByTicker.get(security.ticker) }))
    .filter(({ security }) => marketFilter === "ALL" || security.market === marketFilter)
    .filter(({ security }) => {
      const query = marketQuery.trim().toLocaleLowerCase();
      return !query || `${security.ticker} ${security.name}`.toLocaleLowerCase().includes(query);
    })
    .sort((left, right) => {
      const leftPS = left.record ? getPriceSales(left.record) : null;
      const rightPS = right.record ? getPriceSales(right.record) : null;
      if (marketSort === "CHANGE") {
        return (right.record?.priceChangePercent ?? -Infinity) - (left.record?.priceChangePercent ?? -Infinity);
      }
      if (marketSort === "PS") return (rightPS ?? -Infinity) - (leftPS ?? -Infinity);
      return (right.record?.marketCap ?? -Infinity) - (left.record?.marketCap ?? -Infinity);
    });
  const shownComparables = comparableRows.slice(0, 6);
  const actionItems = [
    ...pendingFacts.map((fact) => ({
      id: fact.id,
      title: fact.title,
      owner: fact.ownerName,
      href: "/facts",
      status: "待审批",
      updatedAt: fact.updatedAt,
    })),
    ...pendingMetrics.map((metric) => ({
      id: metric.id,
      title: metric.name,
      owner: "指标库",
      href: "/metrics",
      status: "待审批",
      updatedAt: metric.updatedAt,
    })),
  ].slice(0, 4);
  const marketAvailability = comparableMarketData.data?.availability;

  return (
    <main className="os-command-page">
      <PageHeader
        actions={
          <>
            <label className="os-range-select">
              <span>时间范围</span>
              <select aria-label="行情时间范围" defaultValue="EOD">
                <option value="EOD">前收盘日终</option>
              </select>
            </label>
            <button
              aria-label="刷新市场数据"
              className="os-refresh-button"
              disabled={comparableMarketData.loading}
              onClick={() => setMarketRequest((current) => current + 1)}
              title="刷新公开市场数据"
              type="button"
            >
              <RefreshCw className={comparableMarketData.loading ? "is-spinning" : ""} size={16} />
              刷新
            </button>
          </>
        }
        description="资本市场、经营指标与行业情报的统一决策入口"
        meta={
          <>
            <span>最后更新 {formatTimestamp(comparableMarketData.data?.fetchedAt)}</span>
            <StatusBadge tone={marketAvailability === "LIVE" ? "success" : "warning"}>
              <span className="os-sync-dot" aria-hidden="true" />
              {marketAvailability === "LIVE" ? "公开市场数据已同步" : "市场数据待刷新"}
            </StatusBadge>
          </>
        }
        title="Command Center"
      />

      <section className="os-kpi-grid" aria-label="关键业务概览">
        <MetricCard
          detail={valuationFact ? valuationFact.periodLabel ?? valuationFact.sourceTitle : "估值数据待接入"}
          href="/facts"
          label="公司最新估值"
          tone={valuationFact ? "success" : "neutral"}
          value={formatFactValue(valuationFact)}
        />
        <MetricCard
          detail={contractFact ? contractFact.periodLabel ?? contractFact.sourceTitle : "订单数据待接入"}
          href="/facts"
          label="在手订单 / 合同"
          tone={contractFact ? "success" : "neutral"}
          value={formatFactValue(contractFact)}
        />
        <MetricCard
          detail={weeklyIntelligenceCount ? "按发布时间统计" : "本周暂无更新"}
          href="/intelligence"
          label="本周行业更新"
          tone="success"
          value={`${weeklyIntelligenceCount} 条`}
        />
        <MetricCard
          detail={pendingCount ? "事实与指标待审批" : "当前无待审批事项"}
          href="/facts"
          label="待处理任务"
          tone={pendingCount ? "warning" : "success"}
          value={`${pendingCount} 项`}
        />
      </section>

      {canReadInvestor && (
        <SectionCard
          action={<Link className="os-text-button" href="/investor-crm">查看投资人 CRM <ArrowUpRight size={14} /></Link>}
          className="os-dashboard-crm"
          eyebrow="资本市场关系"
          title="投资人 CRM"
        >
          {investorAccounts.length ? (
            <div className="os-crm-dashboard-content">
              <dl className="os-crm-dashboard-summary">
                <div><dt>投资人机构</dt><dd>{investorAccounts.length}</dd></div>
                <div><dt>活跃跟进</dt><dd>{investorAccounts.filter((account) => account.relationshipStage === "ACTIVE").length}</dd></div>
                <div><dt>待办行动</dt><dd>{investorAccounts.filter((account) => account.nextAction).length}</dd></div>
              </dl>
              <div className="os-crm-dashboard-list">
                {investorAccounts.slice(0, 4).map((account) => (
                  <Link className="os-crm-dashboard-row" href="/investor-crm" key={account.id}>
                    <div>
                      <strong>{account.name}</strong>
                      <span>{[investorStageLabels[account.relationshipStage] ?? account.relationshipStage, account.focus].filter(Boolean).join(" · ")}</span>
                    </div>
                    <span>{account.nextAction ? `下一步：${account.nextAction}` : "暂无待办"}</span>
                    <ChevronRight aria-hidden="true" size={16} />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState description="新增机构后，这里会汇总关系阶段、下一步行动和路演记录。" title="暂无投资人机构" />
          )}
        </SectionCard>
      )}

      <div className="os-dashboard-grid os-dashboard-grid-primary">
        <SectionCard
          action={<Link className="os-text-button" href="/eac-data">查看 EAC 动态数据 <ArrowUpRight size={14} /></Link>}
          className="os-market-card"
          eyebrow="PUBLIC MARKET DATA"
          title="可比公司市场表现"
        >
          <div className="os-market-toolbar">
            <div className="os-filter-pills" aria-label="市场筛选">
              {(["ALL", "US", "CN", "HK"] as MarketFilter[]).map((market) => (
                <button
                  className={marketFilter === market ? "is-active" : ""}
                  key={market}
                  onClick={() => setMarketFilter(market)}
                  type="button"
                >
                  {market === "ALL" ? "全部" : market === "CN" ? "A 股" : market === "HK" ? "港股" : "美股"}
                </button>
              ))}
            </div>
            <div className="os-table-tools">
              <label className="os-table-search">
                <Search aria-hidden="true" size={15} />
                <input
                  aria-label="搜索可比公司"
                  onChange={(event) => setMarketQuery(event.target.value)}
                  placeholder="搜索公司"
                  value={marketQuery}
                />
              </label>
              <label className="os-sort-select">
                <span>排序</span>
                <select
                  aria-label="可比公司排序"
                  onChange={(event) => setMarketSort(event.target.value as ComparableSort)}
                  value={marketSort}
                >
                  <option value="MARKET_CAP">市值</option>
                  <option value="CHANGE">涨跌幅</option>
                  <option value="PS">P/S</option>
                </select>
              </label>
            </div>
          </div>
          {comparableMarketData.data?.message && (
            <div className="os-data-notice">{comparableMarketData.data.message}</div>
          )}
          {comparableMarketData.error && (
            <div className="os-data-notice is-danger">市场数据暂时不可用，未显示估算值。</div>
          )}
          <DataTable>
            <div className="os-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>公司</th>
                    <th>市场</th>
                    <th>收盘价</th>
                    <th>昨日涨跌</th>
                    <th>市值</th>
                    <th>市销率</th>
                    <th>更新日期</th>
                    <th aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {shownComparables.map(({ security, record }) => {
                    const priceSales = record ? getPriceSales(record) : null;
                    const change = record?.priceChangePercent ?? null;
                    return (
                      <tr key={security.ticker}>
                        <td><span className="os-data-mono os-ticker">{security.ticker}</span></td>
                        <td><strong className="os-company-name">{security.name}</strong></td>
                        <td><span className="os-market-label">{marketLabel(security.market)}</span></td>
                        <td><strong className="os-data-mono">{formatComparablePrice(record?.price ?? null, security.currency)}</strong></td>
                        <td>
                          {change === null ? (
                            <span className="os-muted-data" title="当前日终快照仅提供前收盘价">--</span>
                          ) : (
                            <span className={`os-change ${change >= 0 ? "is-positive" : "is-negative"}`}>
                              {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                            </span>
                          )}
                        </td>
                        <td><span className="os-data-mono">{formatComparableScale(record?.marketCap ?? null, security.currency)}</span></td>
                        <td><span className="os-data-mono">{priceSales === null ? "--" : `${priceSales.toFixed(1)}倍`}</span></td>
                        <td><span className="os-data-date">{formatComparableDate(record?.priceAsOf)}</span></td>
                        <td><Link aria-label={`查看 ${security.name} 研究`} className="os-row-action" href="/intelligence"><ChevronRight size={16} /></Link></td>
                      </tr>
                    );
                  })}
                  {!shownComparables.length && (
                    <tr><td colSpan={9}><EmptyState description="尝试清除搜索条件或切换市场。" title="没有匹配的可比公司" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </DataTable>
          <div className="os-card-footer">
            <span>前收盘价来自腾讯财经，财务数据来自东方财富公开源。</span>
            <span>日终快照 · 24 小时缓存</span>
          </div>
        </SectionCard>

        <SectionCard
          action={<Link className="os-text-button" href="/intelligence">查看全部 <ArrowUpRight size={14} /></Link>}
          className="os-intelligence-card"
          eyebrow="INDUSTRY INTELLIGENCE"
          title="今日行业动态"
        >
          <div className="os-category-tabs" aria-label="行业动态分类">
            <button className={activeCategory === "ALL" ? "is-active" : ""} onClick={() => setActiveCategory("ALL")} type="button">全部</button>
            {categories.slice(0, 3).map((category) => (
              <button className={activeCategory === category.value ? "is-active" : ""} key={category.value} onClick={() => setActiveCategory(category.value)} type="button">{category.label}</button>
            ))}
          </div>
          <div className="os-intelligence-list">
            {activeStream.slice(0, 5).map((item) => (
              <Link className="os-intelligence-item" href={`/intelligence/${item.id}`} key={item.id}>
                <div>
                  <div className="os-intelligence-meta">
                    <StatusBadge tone="info">{item.categoryName}</StatusBadge>
                    <span>{formatRelative(item.publishedAt)}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <ChevronRight aria-hidden="true" size={16} />
              </Link>
            ))}
            {!activeStream.length && <EmptyState description="切换分类或等待 Notion 同步。" title="暂无行业动态" />}
          </div>
        </SectionCard>
      </div>

      <div className="os-dashboard-grid os-dashboard-grid-secondary">
        <SectionCard
          action={<Link className="os-text-button" href="/metrics">指标库 <ArrowUpRight size={14} /></Link>}
          eyebrow="OPERATING METRICS"
          title="公司关键经营指标"
        >
          <div className="os-metric-tabs" aria-label="指标类型">
            {(["ACTUAL", "BUDGET", "FORECAST"] as MetricMode[]).map((mode) => (
              <button className={metricMode === mode ? "is-active" : ""} key={mode} onClick={() => setMetricMode(mode)} type="button">
                {mode === "ACTUAL" ? "Actual" : mode === "BUDGET" ? "Budget" : "Forecast"}
              </button>
            ))}
          </div>
          {visibleMetrics.length ? (
            <div className="os-operating-metrics">
              {visibleMetrics.slice(0, 4).map((metric) => (
                <Link className="os-operating-metric" href="/metrics" key={metric.id}>
                  <div><span>{metric.name}</span><small>{metric.periodLabel}</small></div>
                  <strong>{formatMetric(metric)}</strong>
                  <div className="os-metric-trend">
                    {metric.yoy === null ? <span>暂无同比数据</span> : <span className={metric.yoy >= 0 ? "is-positive" : "is-negative"}>{metric.yoy >= 0 ? "+" : ""}{(metric.yoy * 100).toFixed(1)}% YoY</span>}
                    {metric.unit === "%" && <i aria-hidden="true"><b style={{ width: `${Math.min(Math.max(metric.value * 100, 3), 100)}%` }} /></i>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              description={`${metricMode === "ACTUAL" ? "实际" : metricMode === "BUDGET" ? "预算" : "预测"}指标尚未接入或未获批准。`}
              title="暂无可展示的真实指标"
            />
          )}
        </SectionCard>

        <SectionCard
          action={<Link className="os-text-button" href="/facts">查看全部 <ArrowUpRight size={14} /></Link>}
          eyebrow="DECISION QUEUE"
          title="待办事项与重要决策"
        >
          <div className="os-decision-list">
            {actionItems.map((item) => (
              <Link className="os-decision-item" href={item.href} key={item.id}>
                <span className="os-decision-priority"><ListTodo size={15} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <span>负责人：{item.owner || "未设置"} · 截止时间：未设置</span>
                </div>
                <StatusBadge tone="warning">{item.status}</StatusBadge>
              </Link>
            ))}
            {!actionItems.length && (
              <EmptyState description="当前没有等待审批的事实或指标。" title="暂无待办事项" />
            )}
          </div>
          {!!auditRows.length && (
            <div className="os-recent-audit">
              <Clock3 size={14} /> 最近操作：{auditRows[0].actorName} · {auditRows[0].action} · {formatRelative(auditRows[0].createdAt)}
            </div>
          )}
        </SectionCard>
      </div>
    </main>
  );
}
