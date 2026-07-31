import type { PermissionCode } from "./types";
import { hasPermission } from "./permissions";
import { getCurrentUser } from "./session";

export class AuthenticationError extends Error {}
export class AuthorizationError extends Error {}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError("Authentication required.");
  return user;
}

export async function requirePermission(permission: PermissionCode) {
  const user = await requireUser();
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }
  return user;
}
