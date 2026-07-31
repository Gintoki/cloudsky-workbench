"use client";

import {
  BarChart3,
  Bell,
  BookOpenText,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  FileQuestion,
  Landmark,
  LockKeyhole,
  LogOut,
  Menu,
  Network,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { StatusBadge } from "./ui/workbench-primitives";

type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  availability?: "live" | "soon";
};

const navigation = [
  {
    label: "知识图谱",
    items: [
      { href: "/", label: "Command Center", icon: CircleGauge },
      { href: "/intelligence", label: "行业动态", icon: Newspaper },
      { href: "/metrics", label: "财务指标", icon: BarChart3 },
      { href: "/facts", label: "研究知识库", icon: Network },
      { label: "客户信息", icon: UsersRound, availability: "soon" },
      { label: "投资人 Q&A", icon: FileQuestion, availability: "soon" },
    ],
  },
  {
    label: "投资分析",
    items: [
      { href: "/intelligence", label: "公司研究", icon: Building2 },
      { href: "/metrics", label: "情景分析", icon: BriefcaseBusiness },
      { href: "/#comparables", label: "可比公司", icon: BarChart3 },
      { label: "估值模型", icon: BookOpenText, availability: "soon" },
    ],
  },
  {
    label: "资本市场",
    items: [
      { label: "投资人 CRM", icon: UserRoundSearch, availability: "soon" },
      { label: "Q&A 中心", icon: FileQuestion, availability: "soon" },
      { label: "路演记录", icon: Landmark, availability: "soon" },
      { label: "DD 问题", icon: ClipboardCheck, availability: "soon" },
    ],
  },
  {
    label: "智能助手",
    items: [
      { label: "Research Agent", icon: BrainCircuit, availability: "soon" },
      { label: "DD Agent", icon: Bot, availability: "soon" },
      { label: "Financial Agent", icon: Sparkles, availability: "soon" },
    ],
  },
] satisfies Array<{ label: string; items: NavItem[] }>;

const pathNames: Record<string, string> = {
  "/": "Command Center",
  "/facts": "研究知识库",
  "/metrics": "财务指标",
  "/intelligence": "行业动态",
  "/audit": "权限与审计",
};

const roleNames: Record<AuthUser["role"], string> = {
  ADMINISTRATOR: "管理员",
  DIRECTOR: "投融资总监",
  ANALYST: "分析师",
  VIEWER: "访客",
};

function isActive(pathname: string, href?: string) {
  if (!href || href.startsWith("/#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({
  pathname,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: {
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  return (
    <aside className={`sidebar os-sidebar${mobileOpen ? " open" : ""}`}>
      <div className="os-brand-row">
        <Link aria-label="CloudSky Command Center" className="os-brand" href="/">
          <span className="os-brand-mark">CS</span>
          <span className="os-brand-copy">
            <strong>CloudSky</strong>
            <small>INTELLIGENCE OS</small>
          </span>
        </Link>
        <button
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          className="os-icon-button os-sidebar-toggle"
          onClick={onToggleCollapsed}
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
        <button
          aria-label="关闭导航"
          className="os-icon-button os-mobile-close"
          onClick={onCloseMobile}
          type="button"
        >
          <X size={17} />
        </button>
      </div>

      <nav aria-label="主导航" className="os-nav">
        {navigation.map((section) => (
          <div className="os-nav-group" key={section.label}>
            <span className="os-nav-group-label">{section.label}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              if (!item.href) {
                return (
                  <span
                    aria-disabled="true"
                    className="os-nav-item is-locked"
                    key={item.label}
                    title="建设中"
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
                    <span className="os-nav-item-label">{item.label}</span>
                    <LockKeyhole aria-hidden="true" className="os-nav-lock" size={13} />
                  </span>
                );
              }
              return (
                <Link
                  className={`os-nav-item${active ? " is-active" : ""}`}
                  href={item.href}
                  key={item.label}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
                  <span className="os-nav-item-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="os-sidebar-footer">
        <Link
          className={`os-nav-item${isActive(pathname, "/audit") ? " is-active" : ""}`}
          href="/audit"
          onClick={onCloseMobile}
          title={collapsed ? "权限与审计" : undefined}
        >
          <ShieldCheck aria-hidden="true" size={17} strokeWidth={1.75} />
          <span className="os-nav-item-label">权限与审计</span>
        </Link>
        <span aria-disabled="true" className="os-nav-item is-locked" title="建设中">
          <Settings aria-hidden="true" size={17} strokeWidth={1.75} />
          <span className="os-nav-item-label">系统设置</span>
          <LockKeyhole aria-hidden="true" className="os-nav-lock" size={13} />
        </span>
      </div>
    </aside>
  );
}

function Topbar({
  pathname,
  user,
  onOpenMobile,
  onOpenSearch,
  onLogout,
}: {
  pathname: string;
  user: AuthUser;
  onOpenMobile: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="topbar os-topbar">
      <button
        aria-label="打开导航"
        className="os-icon-button os-mobile-menu"
        onClick={onOpenMobile}
        type="button"
      >
        <Menu size={18} />
      </button>
      <div className="os-breadcrumb" aria-label="当前位置">
        <span>CloudSky</span>
        <ChevronRight aria-hidden="true" size={14} />
        <strong>{pathNames[pathname] ?? "Intelligence OS"}</strong>
      </div>
      <div className="os-topbar-spacer" />
      <button className="os-search-trigger" onClick={onOpenSearch} type="button">
        <Search aria-hidden="true" size={16} />
        <span>搜索</span>
        <kbd>Ctrl K</kbd>
      </button>
      <StatusBadge tone="success">
        <span className="os-sync-dot" aria-hidden="true" /> Notion 已同步
      </StatusBadge>
      <button aria-label="通知" className="os-icon-button" title="通知" type="button">
        <Bell size={17} />
      </button>
      <div className="os-user-menu-wrap">
        <button
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
          aria-label="打开用户菜单"
          className="os-user-trigger"
          onClick={() => setUserMenuOpen((open) => !open)}
          type="button"
        >
          <span>{user.displayName.slice(0, 1).toUpperCase()}</span>
        </button>
        {userMenuOpen && (
          <div className="os-user-menu" role="menu">
            <strong>{user.displayName}</strong>
            <span>{roleNames[user.role]}</span>
            <button onClick={onLogout} role="menuitem" type="button">
              <LogOut size={15} /> 退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const routes = useMemo(
    () =>
      navigation
        .flatMap((section) => section.items)
        .filter((item) => item.href && item.availability !== "soon")
        .concat([{ href: "/audit", label: "权限与审计", icon: ShieldCheck }]),
    [],
  );
  const results = routes.filter((item) =>
    item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (open) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(focusTimer);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="os-command-overlay" onMouseDown={onClose} role="presentation">
      <div
        aria-label="全局搜索"
        aria-modal="true"
        className="os-command-palette"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <Search aria-hidden="true" size={18} />
        <input
          aria-label="搜索页面"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索页面或功能"
          ref={inputRef}
          value={query}
        />
        <kbd>Esc</kbd>
        <div className="os-command-results">
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href ?? "/"} key={item.label} onClick={onClose}>
                <Icon aria-hidden="true" size={16} />
                <span>{item.label}</span>
                <ChevronRight aria-hidden="true" size={15} />
              </Link>
            );
          })}
          {!results.length && <p>没有匹配的页面</p>}
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => {
      setSidebarCollapsed(window.localStorage.getItem("cloudsky-sidebar-collapsed") === "true");
    }, 0);
    return () => window.clearTimeout(preferenceTimer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem("cloudsky-sidebar-collapsed", String(next));
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={`app-shell command-shell${sidebarCollapsed ? " is-collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onToggleCollapsed={toggleSidebar}
        pathname={pathname}
      />
      <div className="main-column">
        <Topbar
          onLogout={() => void logout()}
          onOpenMobile={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          pathname={pathname}
          user={user}
        />
        {children}
      </div>
      {sidebarOpen && <button aria-label="关闭导航遮罩" className="os-sidebar-scrim" onClick={() => setSidebarOpen(false)} type="button" />}
      <CommandPalette onClose={() => setSearchOpen(false)} open={searchOpen} />
    </div>
  );
}

export const WorkbenchShell = AppShell;
