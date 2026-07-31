"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  Link2,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { useApiData } from "@/lib/client/use-api-data";
import type { IntelligenceRecord } from "@/lib/domain/types";
import { ErrorState, LoadingState } from "./page-states";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

export function IntelligenceDetailView({ itemId }: { itemId: string }) {
  const state = useApiData<IntelligenceRecord>(
    `/api/intelligence/${encodeURIComponent(itemId)}`,
  );
  if (state.loading) return <LoadingState />;
  if (state.error || !state.data) return <ErrorState retry={state.retry} />;

  const item = state.data;
  return (
    <main className="page intelligence-detail-page">
      <Link className="back-link" href="/intelligence">
        <ArrowLeft size={13} /> 返回行业动态
      </Link>
      <div className="detail-heading">
        <div>
          <div className="detail-kicker">
            <span className="badge">{item.categoryName}</span>
            <span>
              <CalendarDays size={12} /> {formatDate(item.publishedAt)}
            </span>
            {item.eventType && <span>{item.eventType}</span>}
          </div>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
        </div>
        <div className="detail-entities">
          <span>关联公司 / 专题</span>
          {item.companies.map((company) => (
            <Link
              className="company-chip"
              href={`/intelligence?company=${company.id}`}
              key={company.id}
            >
              <Building2 size={11} /> {company.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="intelligence-detail-grid">
        <article className="panel detail-article">
          <div className="panel-heading">
            <div>
              <div className="panel-title">事件详情</div>
              <div className="panel-subtitle">结构化整理自 Notion 行业雷达</div>
            </div>
          </div>
          <p>{item.details}</p>

          <section className="detail-section">
            <h2>与云天畅想的关系</h2>
            <p>{item.relationshipToCloudsky ?? "Notion 来源未记录相关判断。"}</p>
          </section>

          {item.tags.length > 0 && (
            <div className="tag-row">
              {item.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        <aside className="detail-sidebar">
          <section className="panel source-card">
            <div className="panel-heading">
              <div>
                <div className="panel-title">来源与限定</div>
                <div className="panel-subtitle">保留原始证据链</div>
              </div>
              <Link2 size={15} />
            </div>
            <p className="source-note">{item.sourceNote}</p>
            <div className="source-list">
              {item.sourceLinks.map((source) => (
                <a
                  href={source.url}
                  key={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink size={12} />
                  <span>{source.label}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="panel source-card">
            <div className="panel-heading">
              <div>
                <div className="panel-title">Notion 研究页</div>
                <div className="panel-subtitle">{item.sourceTitle}</div>
              </div>
              <Radar size={15} />
            </div>
            {item.notionPageUrl && (
              <a
                className="button secondary full-width"
                href={item.notionPageUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={13} /> 查看 Notion 原页面
              </a>
            )}
            <div className="source-meta">
              <span>内容状态</span>
              <strong>{item.status}</strong>
              <span>最近导入</span>
              <strong>
                {new Intl.DateTimeFormat("zh-CN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Shanghai",
                }).format(new Date(item.fetchedAt))}
              </strong>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
