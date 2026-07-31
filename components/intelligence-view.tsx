"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  ExternalLink,
  FilterX,
  Radar,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useApiData } from "@/lib/client/use-api-data";
import type { IntelligenceListResult } from "@/lib/domain/types";
import { ErrorState, LoadingState } from "./page-states";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

export function IntelligenceView({
  initialCategory = "",
  initialCompany = "",
  initialSort = "newest",
}: {
  initialCategory?: string;
  initialCompany?: string;
  initialSort?: "newest" | "oldest";
}) {
  const [category, setCategory] = useState(initialCategory);
  const [company, setCompany] = useState(initialCompany);
  const [sort, setSort] = useState<"newest" | "oldest">(initialSort);
  const url = useMemo(() => {
    const query = new URLSearchParams({ sort });
    if (category) query.set("category", category);
    if (company) query.set("company", company);
    return `/api/intelligence?${query.toString()}`;
  }, [category, company, sort]);
  const state = useApiData<IntelligenceListResult>(url);

  if (state.loading) return <LoadingState />;
  if (state.error || !state.data) return <ErrorState retry={state.retry} />;

  const { items, categories, companies, total } = state.data;
  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">行业动态</h1>
          <p className="page-description">
            按分类、研究对象和时间查看行业雷达中的公司动态与研究摘要。
          </p>
        </div>
        <a
          className="button secondary"
          href="https://app.notion.com/p/3ac46ba20d9a8144ba0ae53e401dd80a"
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={13} /> 打开 Notion 来源
        </a>
      </div>

      <div className="source-banner" role="note">
        <Radar size={15} />
        <div>
          <strong>来源：Notion「01 Projects → 行业雷达」</strong>
          <span>
            当前导入 4 个分类、19 个研究对象和 30 条时间线事件。媒体转述、公司口径与未确认信息均保留原始限定语。
          </span>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar intelligence-toolbar">
          <label className="compact-field">
            <span>行业分类</span>
            <select
              aria-label="按行业分类筛选"
              className="field"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">全部分类</option>
              {categories.map((facet) => (
                <option key={facet.value} value={facet.value}>
                  {facet.label}（{facet.count}）
                </option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span>公司 / 专题</span>
            <select
              aria-label="按公司筛选"
              className="field"
              onChange={(event) => setCompany(event.target.value)}
              value={company}
            >
              <option value="">全部研究对象</option>
              {companies.map((facet) => (
                <option key={facet.value} value={facet.value}>
                  {facet.label}（{facet.count}）
                </option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span>时间排序</span>
            <select
              aria-label="按时间排序"
              className="field"
              onChange={(event) =>
                setSort(event.target.value as "newest" | "oldest")
              }
              value={sort}
            >
              <option value="newest">最新在前</option>
              <option value="oldest">最早在前</option>
            </select>
          </label>
          <button
            className="button secondary intelligence-reset"
            onClick={() => {
              setCategory("");
              setCompany("");
              setSort("newest");
            }}
            type="button"
          >
            <FilterX size={13} /> 清除筛选
          </button>
          <div className="toolbar-spacer" />
          <span className="panel-meta">
            {sort === "newest" ? (
              <ArrowDownAZ size={13} />
            ) : (
              <ArrowUpAZ size={13} />
            )}
            共 {total} 条
          </span>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div>
              <div className="empty-icon">
                <Radar size={15} />
              </div>
              <div className="empty-title">没有符合条件的行业动态</div>
              <div className="empty-text">清除筛选或选择其他研究对象。</div>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table intelligence-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>分类</th>
                  <th>公司 / 专题</th>
                  <th>动态与摘要</th>
                  <th>事件类型</th>
                  <th aria-label="详情" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="mono intelligence-date">
                      {formatDate(item.publishedAt)}
                    </td>
                    <td>
                      <span className="badge">{item.categoryName}</span>
                    </td>
                    <td>
                      <div className="company-links">
                        {item.companies.map((linkedCompany) => (
                          <button
                            className="company-chip"
                            key={linkedCompany.id}
                            onClick={() => setCompany(linkedCompany.id)}
                            title={`筛选 ${linkedCompany.name}`}
                            type="button"
                          >
                            <Building2 size={11} />
                            {linkedCompany.name}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="intelligence-summary-cell">
                      <a
                        className="intelligence-title"
                        href={`/intelligence/${item.id}`}
                      >
                        {item.title}
                      </a>
                      <p>{item.summary}</p>
                      {item.tags.length > 0 && (
                        <div className="tag-row">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span className="tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{item.eventType}</td>
                    <td>
                      <a
                        aria-label={`查看 ${item.title} 详情`}
                        className="text-link"
                        href={`/intelligence/${item.id}`}
                      >
                        查看
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>按事件发生日期排序</span>
          <span>数据抓取时间：2026-07-30</span>
        </div>
      </section>
    </main>
  );
}
