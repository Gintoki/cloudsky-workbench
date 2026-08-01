"use client";

import { ArrowUpRight, FilePlus2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiData } from "@/lib/client/use-api-data";
import type { ResearchListItem } from "@/lib/company-research/types";
import { ErrorState, LoadingState } from "./page-states";
import { DataTable, EmptyState, PageHeader, StatusBadge } from "./ui/workbench-primitives";

type CompanyResearchListResult = {
  databaseAvailable: boolean;
  items: ResearchListItem[];
};

const conclusionLabels: Record<string, string> = {
  POSITIVE_RESEARCH: "积极研究",
  WATCH: "观察",
  CAUTIOUS: "谨慎",
  AVOID: "回避",
  INSUFFICIENT_INFORMATION: "信息不足",
};
const valuationStatusLabels: Record<string, string> = {
  PENDING: "待估值",
  MARKET_REFERENCE_UPDATED: "市场参考已更新",
  COMPLETED: "已完成",
};

function formatDate(value: string | null) {
  if (!value) return "暂无更新";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function conclusionTone(conclusion: string | null): "success" | "warning" | "danger" | "info" | "neutral" {
  if (conclusion === "POSITIVE_RESEARCH") return "success";
  if (conclusion === "CAUTIOUS") return "warning";
  if (conclusion === "AVOID") return "danger";
  if (conclusion === "WATCH") return "info";
  return "neutral";
}

function valuationStatusLabel(value: string | null) {
  if (!value) return "待建立";
  return valuationStatusLabels[value] ?? "待更新";
}

export function CompanyResearchListView({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState("");
  const state = useApiData<CompanyResearchListResult>("/api/company-research");
  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return state.data?.items ?? [];
    return (state.data?.items ?? []).filter((item) =>
      [item.companyName, item.shortName, item.industry]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalized)),
    );
  }, [query, state.data?.items]);

  async function createReport(companyId: string) {
    setCreatingId(companyId);
    setWriteError("");
    try {
      const response = await fetch("/api/company-research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (!response.ok) throw new Error("Create failed");
      router.push(`/company-research/${companyId}`);
      router.refresh();
    } catch {
      setWriteError("创建研究失败，请检查权限或数据库连接后重试。");
    } finally {
      setCreatingId(null);
    }
  }

  if (state.loading) return <LoadingState />;
  if (state.error || !state.data) return <ErrorState retry={state.retry} />;

  return (
    <main className="page company-research-page">
      <PageHeader
        title="公司研究"
        description="跟踪公司判断、核心假设和关键动态。"
        meta={<span>{state.data.items.filter((item) => item.reportId).length} 份研究档案</span>}
      />
      {!state.data.databaseAvailable ? (
        <EmptyState
          title="公司研究需要数据库连接"
          description="当前环境没有可用的持久化数据库，因此不会显示模拟研究档案。接入数据库后即可从已有公司创建研究。"
        />
      ) : (
        <>
          <div className="company-research-toolbar">
            <label className="company-research-search">
              <Search aria-hidden="true" size={16} />
              <input
                aria-label="搜索公司研究"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索公司或行业"
                value={query}
              />
            </label>
            <span>{items.length} 家研究对象</span>
          </div>
          {writeError && <p className="company-research-write-error" role="alert">{writeError}</p>}
          <DataTable className="company-research-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>公司</th>
                  <th>行业</th>
                  <th>当前判断</th>
                  <th>核心判断</th>
                  <th>估值状态</th>
                  <th>最近更新</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.companyId}>
                    <td>
                      <Link className="company-research-company" href={`/company-research/${item.companyId}`}>
                        <strong>{item.companyName}</strong>
                        {item.shortName && <span>{item.shortName}</span>}
                        {item.tags.length > 0 && (
                          <span className="company-research-tag-row">
                            {item.tags.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td>{item.industry ?? "未分类"}</td>
                    <td>
                      {item.conclusion ? (
                        <StatusBadge tone={conclusionTone(item.conclusion)}>
                          {conclusionLabels[item.conclusion]}
                        </StatusBadge>
                      ) : (
                        <StatusBadge>待建立</StatusBadge>
                      )}
                    </td>
                    <td className="company-research-tension">{item.coreTension ?? "暂无数据"}</td>
                    <td>{valuationStatusLabel(item.valuationStatus)}</td>
                    <td className="mono">{formatDate(item.updatedAt)}</td>
                    <td>
                      {item.reportId ? (
                        <Link aria-label={`打开 ${item.companyName} 研究`} className="company-research-open" href={`/company-research/${item.companyId}`}>
                          <ArrowUpRight size={16} />
                        </Link>
                      ) : canCreate ? (
                        <button
                          className="button secondary company-research-create"
                          disabled={creatingId === item.companyId}
                          onClick={() => void createReport(item.companyId)}
                          type="button"
                        >
                          <FilePlus2 size={14} />
                          {creatingId === item.companyId ? "创建中" : "建立研究"}
                        </button>
                      ) : (
                        <span className="company-research-muted">待建立</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
          {!items.length && (
            <EmptyState
              title="没有匹配的公司"
              description="调整搜索关键词后重试。"
            />
          )}
        </>
      )}
    </main>
  );
}
