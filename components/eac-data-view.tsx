"use client";

import { ArrowUpRight, ChevronRight, RefreshCw, Search, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApiData } from "@/lib/client/use-api-data";
import type { ComparableMarketDataResult, IntelligenceListResult } from "@/lib/domain/types";
import {
  comparableUniverse,
  eacFocusCategoryByTicker,
  eacFocusCategoryLabels,
  type EacFocusCategory,
} from "@/lib/market-data/coverage-universe";
import {
  formatComparableDate,
  formatComparablePrice,
  formatComparableScale,
  getPriceSales,
  marketLabel,
} from "@/lib/market-data/formatters";
import { DataTable, EmptyState, PageHeader, SectionCard, Skeleton, StatusBadge } from "./ui/workbench-primitives";

type MarketFilter = "ALL" | "US" | "CN" | "HK";
type FocusFilter = "ALL" | EacFocusCategory;
type ComparableSort = "MARKET_CAP" | "DAILY_CHANGE" | "THIRTY_DAY_CHANGE" | "YTD_CHANGE" | "PS";

function formatRelative(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1_440) return `${Math.round(minutes / 60)} 小时前`;
  return `${Math.round(minutes / 1_440)} 天前`;
}

function ChangeValue({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="os-muted-data">--</span>;
  return (
    <span className={`os-change ${value >= 0 ? "is-positive" : "is-negative"}`}>
      {value >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {value >= 0 ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function EacDataSkeleton() {
  return (
    <main className="os-command-page eac-data-page" aria-label="正在加载 EAC 动态数据">
      <div className="os-loading-header"><Skeleton className="os-skeleton-title" /><Skeleton className="os-skeleton-copy" /></div>
      <Skeleton className="os-skeleton-panel eac-data-skeleton" />
      <Skeleton className="os-skeleton-panel eac-data-skeleton" />
    </main>
  );
}

export function EacDataView() {
  const [marketRequest, setMarketRequest] = useState(0);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("ALL");
  const [marketSort, setMarketSort] = useState<ComparableSort>("MARKET_CAP");
  const [query, setQuery] = useState("");
  const comparableMarketData = useApiData<ComparableMarketDataResult>(
    `/api/market-data/comparables${marketRequest ? `?refresh=1&request=${marketRequest}` : ""}`,
  );
  const intelligence = useApiData<IntelligenceListResult>("/api/intelligence?sort=newest");

  const comparableByTicker = useMemo(
    () => new Map((comparableMarketData.data?.items ?? []).map((item) => [item.ticker, item])),
    [comparableMarketData.data?.items],
  );
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return comparableUniverse
      .map((security) => ({ security, record: comparableByTicker.get(security.ticker) }))
      .filter(({ security }) => marketFilter === "ALL" || security.market === marketFilter)
      .filter(({ security }) => focusFilter === "ALL" || eacFocusCategoryByTicker[security.ticker] === focusFilter)
      .filter(({ security }) => !normalizedQuery || `${security.ticker} ${security.name}`.toLocaleLowerCase().includes(normalizedQuery))
      .sort((left, right) => {
        const leftPS = left.record ? getPriceSales(left.record) : null;
        const rightPS = right.record ? getPriceSales(right.record) : null;
        const sortValues: Record<ComparableSort, [number | null | undefined, number | null | undefined]> = {
          MARKET_CAP: [left.record?.marketCap, right.record?.marketCap],
          DAILY_CHANGE: [left.record?.priceChangePercent, right.record?.priceChangePercent],
          THIRTY_DAY_CHANGE: [left.record?.thirtyDayChangePercent, right.record?.thirtyDayChangePercent],
          YTD_CHANGE: [left.record?.yearToDateChangePercent, right.record?.yearToDateChangePercent],
          PS: [leftPS, rightPS],
        };
        const [leftValue, rightValue] = sortValues[marketSort];
        return (rightValue ?? -Infinity) - (leftValue ?? -Infinity);
      });
  }, [comparableByTicker, focusFilter, marketFilter, marketSort, query]);

  if (comparableMarketData.loading || intelligence.loading) return <EacDataSkeleton />;

  const intelligenceItems = intelligence.data?.items ?? [];
  const availability = comparableMarketData.data?.availability;

  return (
    <main className="os-command-page eac-data-page">
      <PageHeader
        actions={
          <button
            aria-label="刷新 EAC 动态数据"
            className="os-refresh-button"
            disabled={comparableMarketData.loading}
            onClick={() => setMarketRequest((value) => value + 1)}
            type="button"
          >
            <RefreshCw className={comparableMarketData.loading ? "is-spinning" : ""} size={16} />
            刷新
          </button>
        }
        description="公开行情与行业动态的日终监测视图。缺失公开历史的数据不作估算。"
        meta={<StatusBadge tone={availability === "LIVE" ? "success" : "warning"}>{availability === "LIVE" ? "公开数据已同步" : "行情数据待更新"}</StatusBadge>}
        title="EAC动态数据"
      />

      <SectionCard
        action={<span className="os-section-caption">{rows.length} 家公司</span>}
        className="eac-market-card"
        eyebrow="公开市场数据"
        title="EAC 行情数据"
      >
        <div className="os-market-toolbar">
          <div className="os-filter-pills" aria-label="市场筛选">
            {(["ALL", "US", "CN", "HK"] as MarketFilter[]).map((market) => (
              <button className={market === marketFilter ? "is-active" : ""} key={market} onClick={() => setMarketFilter(market)} type="button">
                {market === "ALL" ? "全部" : marketLabel(market)}
              </button>
            ))}
          </div>
          <div className="os-table-tools">
            <label className="os-table-search">
              <Search aria-hidden="true" size={15} />
              <input aria-label="搜索 EAC 公司" onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司或代码" value={query} />
            </label>
            <label className="os-sort-select">
              <span>分类</span>
              <select aria-label="EAC 公司分类筛选" onChange={(event) => setFocusFilter(event.target.value as FocusFilter)} value={focusFilter}>
                <option value="ALL">全部分类</option>
                {(Object.keys(eacFocusCategoryLabels) as EacFocusCategory[]).map((category) => <option key={category} value={category}>{eacFocusCategoryLabels[category]}</option>)}
              </select>
            </label>
            <label className="os-sort-select">
              <span>排序</span>
              <select aria-label="EAC 公司排序" onChange={(event) => setMarketSort(event.target.value as ComparableSort)} value={marketSort}>
                <option value="MARKET_CAP">市值</option>
                <option value="DAILY_CHANGE">昨日涨跌</option>
                <option value="THIRTY_DAY_CHANGE">30日涨跌</option>
                <option value="YTD_CHANGE">今年涨跌</option>
                <option value="PS">市销率</option>
              </select>
            </label>
          </div>
        </div>
        {comparableMarketData.data?.message && <div className="os-data-notice">{comparableMarketData.data.message}</div>}
        {comparableMarketData.error && <div className="os-data-notice is-danger">市场数据暂时不可用，未显示缓存或估算值。</div>}
        <DataTable className="eac-market-table">
          <div className="os-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>代码</th><th>公司</th><th>市场</th><th>收盘价</th><th>昨日涨跌</th><th>30日涨跌</th><th>今年涨跌</th><th>市值</th><th>市销率</th><th>更新日期</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ security, record }) => {
                  const priceSales = record ? getPriceSales(record) : null;
                  return (
                    <tr key={security.ticker}>
                      <td><span className="os-data-mono os-ticker">{security.ticker}</span></td>
                      <td><strong className="os-company-name">{security.name}</strong></td>
                      <td><span className="os-market-label">{marketLabel(security.market)}</span></td>
                      <td><strong className="os-data-mono">{formatComparablePrice(record?.price ?? null, security.currency)}</strong></td>
                      <td><ChangeValue value={record?.priceChangePercent} /></td>
                      <td><ChangeValue value={record?.thirtyDayChangePercent} /></td>
                      <td><ChangeValue value={record?.yearToDateChangePercent} /></td>
                      <td><span className="os-data-mono">{formatComparableScale(record?.marketCap ?? null, security.currency)}</span></td>
                      <td><span className="os-data-mono">{priceSales === null ? "--" : `${priceSales.toFixed(1)}倍`}</span></td>
                      <td><span className="os-data-date">{formatComparableDate(record?.priceAsOf)}</span></td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={10}><EmptyState description="请调整筛选条件或稍后刷新公开数据。" title="没有匹配的公司" /></td></tr>}
              </tbody>
            </table>
          </div>
        </DataTable>
        <div className="os-card-footer">
          <span>收盘价与区间涨跌来自公开日线；市值单位按原市场币种显示。</span>
          <span>财务口径来自公开披露</span>
        </div>
      </SectionCard>

      <SectionCard
        action={<Link className="os-text-button" href="/intelligence">查看全部 <ArrowUpRight size={14} /></Link>}
        className="eac-intelligence-card"
        eyebrow="行业情报"
        title="今日行业动态"
      >
        {intelligence.error ? (
          <EmptyState description="行业动态暂时无法加载，未以缓存内容代替。" title="数据加载失败" />
        ) : intelligenceItems.length ? (
          <div className="os-intelligence-list eac-intelligence-list">
            {intelligenceItems.slice(0, 8).map((item) => (
              <Link className="os-intelligence-item" href={`/intelligence/${item.id}`} key={item.id}>
                <div>
                  <div className="os-intelligence-meta"><StatusBadge tone="info">{item.categoryName}</StatusBadge><span>{formatRelative(item.publishedAt)}</span></div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <ChevronRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState description="等待 Notion 同步或新增已核验的行业信息。" title="暂无行业动态" />
        )}
      </SectionCard>
    </main>
  );
}
