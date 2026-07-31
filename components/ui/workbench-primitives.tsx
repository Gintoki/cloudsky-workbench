import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`os-status-badge ${tone}`}>{children}</span>;
}

export function SectionCard({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`os-section-card ${className}`}>
      <div className="os-section-header">
        <div>
          {eyebrow && <div className="os-section-eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {action && <div className="os-section-action">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="os-page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="os-page-header-right">
        {meta && <div className="os-page-meta">{meta}</div>}
        {actions && <div className="os-page-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
  tone?: Tone;
}) {
  return (
    <Link className="os-metric-card" href={href}>
      <div className="os-metric-label">
        <span>{label}</span>
        <StatusBadge tone={tone}>{tone === "success" ? "已同步" : "待接入"}</StatusBadge>
      </div>
      <strong>{value}</strong>
      <span className="os-metric-detail">{detail}</span>
      <ArrowUpRight aria-hidden="true" className="os-metric-arrow" size={15} />
    </Link>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="os-empty-state">
      <Inbox aria-hidden="true" size={18} />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`os-skeleton ${className}`} />;
}

export function DataTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`os-data-table ${className}`}>{children}</div>;
}
