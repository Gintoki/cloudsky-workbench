"use client";

import {
  Bell,
  BookOpenText,
  Building2,
  Calculator,
  ChartNoAxesCombined,
  ChevronRight,
  CircleGauge,
  Database,
  FileQuestion,
  LogOut,
  Menu,
  Newspaper,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthUser } from "@/lib/auth/types";

const primaryNav = [
  { href: "/", label: "首页工作台", icon: CircleGauge },
  { href: "/facts", label: "公司事实库", icon: Database },
  { href: "/metrics", label: "指标库", icon: ChartNoAxesCombined },
  { href: "/audit", label: "审计日志", icon: ShieldCheck },
];

const futureNav = [
  { label: "上市公司", icon: Building2 },
  { label: "估值建模", icon: Calculator },
  { label: "行业动态", icon: Newspaper },
  { label: "叙事资产", icon: BookOpenText },
  { label: "Investor Q&A", icon: FileQuestion },
  { label: "AI 问答中心", icon: Sparkles },
];

const pathNames: Record<string, string> = {
  "/": "首页工作台",
  "/facts": "公司事实库",
  "/metrics": "指标库",
  "/audit": "审计日志",
};

const roleNames: Record<AuthUser["role"], string> = {
  ADMINISTRATOR: "Administrator",
  DIRECTOR: "Director",
  ANALYST: "Analyst",
  VIEWER: "Viewer",
};

export function WorkbenchShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">CS</div>
          <div>
            <div className="brand-title">CloudSky Workbench</div>
            <div className="brand-subtitle">Capital & Strategy</div>
          </div>
          <button
            aria-label="关闭导航"
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: "auto", color: "#c4d2e0" }}
          >
            <X size={17} />
          </button>
        </div>

        <nav aria-label="主导航">
          <div className="nav-section">
            <div className="nav-label">Workbench</div>
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <a
                  className={`nav-link${active ? " active" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {item.label}
                  {item.href === "/facts" && (
                    <span className="nav-count">3</span>
                  )}
                </a>
              );
            })}
          </div>
          <div className="nav-section">
            <div className="nav-label">Research & Capital</div>
            <Link
              className={`nav-link${
                pathname === "/intelligence" ||
                pathname.startsWith("/intelligence/")
                  ? " active"
                  : ""
              }`}
              href="/intelligence"
              onClick={() => setSidebarOpen(false)}
            >
              <Newspaper size={15} strokeWidth={1.8} />
              行业动态
            </Link>
            {futureNav.filter((item) => item.icon !== Newspaper).map((item) => {
              const Icon = item.icon;
              return (
                <span
                  className="nav-link disabled"
                  key={item.label}
                  title="后续阶段开放"
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <span className="nav-link disabled">
            <Settings size={15} />
            系统设置
          </span>
          <div className="user-block">
            <div className="user-avatar">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">{user.displayName}</div>
              <div className="user-role">{roleNames[user.role]}</div>
            </div>
            <button
              aria-label="退出登录"
              className="icon-button"
              onClick={logout}
              style={{ marginLeft: "auto", color: "#8ea4bd" }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            aria-label="打开导航"
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="breadcrumb">
            资本与战略 <ChevronRight size={11} style={{ display: "inline" }} />{" "}
            <strong>{pathNames[pathname] ?? "工作台"}</strong>
          </div>
          <label className="global-search">
            <Search size={14} />
            <input
              aria-label="全局搜索"
              placeholder="搜索事实、指标、来源和研究内容"
            />
            <span className="shortcut">⌘ K</span>
          </label>
          <button aria-label="通知" className="icon-button">
            <Bell size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
