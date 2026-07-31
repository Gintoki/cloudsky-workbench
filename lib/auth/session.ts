import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, hasDatabase } from "@/db/client";
import { roles, sessions, userRoles, users } from "@/db/schema";
import type { AuthUser } from "./types";

export const SESSION_COOKIE = "cloudsky_session";

function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  const ttlHours = Number(process.env.SESSION_TTL_HOURS ?? "12");
  if (hasDatabase() && !user.email.endsWith("@cloudsky.demo")) {
    const rawToken = `db_${crypto.randomUUID()}_${crypto.randomUUID()}`;
    const tokenHash = await hashToken(rawToken);
    await getDb().insert(sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1_000),
    });
    return rawToken;
  }
  return new SignJWT({
    organizationId: user.organizationId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ttlHours}h`)
    .setJti(crypto.randomUUID())
    .sign(sessionKey());
}

export async function readSessionToken(
  token: string | undefined,
): Promise<AuthUser | null> {
  if (!token) return null;
  if (token.startsWith("db_")) {
    if (!hasDatabase()) return null;
    const rows = await getDb()
      .select({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        displayName: users.displayName,
        role: roles.code,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(sessions.tokenHash, await hashToken(token)),
          eq(users.status, "ACTIVE"),
          gt(sessions.expiresAt, new Date()),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row
      ? {
          id: row.id,
          organizationId: row.organizationId,
          email: row.email,
          displayName: row.displayName,
          role: row.role as AuthUser["role"],
        }
      : null;
  }
  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
    });
    if (
      !payload.sub ||
      typeof payload.organizationId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.displayName !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      id: payload.sub,
      organizationId: payload.organizationId,
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role as AuthUser["role"],
    };
  } catch {
    return null;
  }
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function revokeSessionToken(
  token: string | undefined,
): Promise<void> {
  if (!token?.startsWith("db_") || !hasDatabase()) return;
  await getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, await hashToken(token)));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Number(process.env.SESSION_TTL_HOURS ?? "12") * 60 * 60,
  };
}
