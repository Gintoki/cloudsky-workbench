import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import { roles, userRoles, users } from "@/db/schema";
import { loginLogs } from "@/db/schema";
import { authenticateDemoUser } from "./demo-users";
import type { AuthUser } from "./types";

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const demoUser = authenticateDemoUser(email, password);
  if (demoUser) return demoUser;
  if (!hasDatabase()) return null;

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      organizationId: users.organizationId,
      email: users.email,
      displayName: users.displayName,
      passwordHash: users.passwordHash,
      status: users.status,
      role: roles.code,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(
      and(
        eq(users.email, email.toLocaleLowerCase()),
        eq(users.status, "ACTIVE"),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.passwordHash))) return null;
  return {
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    displayName: row.displayName,
    role: row.role as AuthUser["role"],
  };
}

export async function recordLoginAttempt(input: {
  email: string;
  user: AuthUser | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  if (!hasDatabase() || input.email.endsWith("@cloudsky.demo")) return;
  const db = getDb();
  await db.insert(loginLogs).values({
    organizationId: input.user?.organizationId,
    userId: input.user?.id,
    emailAttempted: input.email,
    result: input.user ? "SUCCESS" : "FAILURE",
    reason: input.user ? null : "INVALID_CREDENTIALS_OR_DISABLED",
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
  if (input.user) {
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, input.user.id));
  }
}
