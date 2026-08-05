export type RoleCode =
  | "ADMINISTRATOR"
  | "DIRECTOR"
  | "ANALYST"
  | "VIEWER";

export type PermissionCode =
  | "*"
  | "dashboard.read"
  | "facts.read"
  | "facts.create"
  | "facts.update"
  | "facts.submit"
  | "facts.approve"
  | "metrics.read"
  | "metrics.create"
  | "metrics.update"
  | "metrics.approve"
  | "intelligence.read"
  | "intelligence.create"
  | "intelligence.update"
  | "research.read"
  | "research.create"
  | "research.update"
  | "research.submit"
  | "research.approve"
  | "agent.read"
  | "agent.writeback"
  | "investor.read"
  | "investor.create"
  | "investor.update"
  | "audit.read"
  | "users.manage"
  | "roles.manage"
  | "settings.manage";

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  displayName: string;
  role: RoleCode;
}
