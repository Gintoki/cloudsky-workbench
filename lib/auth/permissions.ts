import type { AuthUser, PermissionCode, RoleCode } from "./types";

const rolePermissions: Record<RoleCode, ReadonlySet<PermissionCode>> = {
  ADMINISTRATOR: new Set(["*"]),
  DIRECTOR: new Set([
    "dashboard.read",
    "facts.read",
    "facts.create",
    "facts.update",
    "facts.submit",
    "facts.approve",
    "metrics.read",
    "metrics.create",
    "metrics.update",
    "metrics.approve",
    "intelligence.read",
    "intelligence.create",
    "intelligence.update",
    "research.read",
    "research.create",
    "research.update",
    "research.submit",
    "research.approve",
    "investor.read",
    "investor.create",
    "investor.update",
    "audit.read",
  ]),
  ANALYST: new Set([
    "dashboard.read",
    "facts.read",
    "facts.create",
    "facts.update",
    "facts.submit",
    "metrics.read",
    "metrics.create",
    "metrics.update",
    "intelligence.read",
    "intelligence.create",
    "intelligence.update",
    "research.read",
    "research.create",
    "research.update",
    "research.submit",
    "investor.read",
    "investor.create",
    "investor.update",
  ]),
  VIEWER: new Set([
    "dashboard.read",
    "facts.read",
    "metrics.read",
    "intelligence.read",
    "research.read",
  ]),
};

export function hasPermission(
  user: Pick<AuthUser, "role">,
  permission: PermissionCode,
): boolean {
  const permissions = rolePermissions[user.role];
  return permissions.has("*") || permissions.has(permission);
}

export function permissionsForRole(role: RoleCode): PermissionCode[] {
  return [...rolePermissions[role]];
}
