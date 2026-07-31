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
