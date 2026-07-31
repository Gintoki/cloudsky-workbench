import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hasDatabase } from "@/db/client";
import { auditLogs, sessions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/authorize";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { apiError } from "@/lib/http/api";

const inputSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (!hasDatabase() || actor.email.endsWith("@cloudsky.demo")) {
      return NextResponse.json(
        {
          error: "DEMO_ACCOUNT",
          message: "Demo 账号密码固定；生产数据库账号可使用此接口修改密码。",
        },
        { status: 409 },
      );
    }
    const input = inputSchema.parse(await request.json());
    const db = getDb();
    const [record] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);
    if (
      !record ||
      !(await bcrypt.compare(input.currentPassword, record.passwordHash))
    ) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "当前密码不正确。" },
        { status: 400 },
      );
    }
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash: await bcrypt.hash(input.newPassword, 12),
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, actor.id));
      await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.userId, actor.id));
      await tx.insert(auditLogs).values({
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CHANGE_PASSWORD",
        resourceType: "USER",
        resourceId: actor.id,
        requestId: crypto.randomUUID(),
        metadataJson: { title: actor.email },
      });
    });
    const response = NextResponse.json({
      ok: true,
      message: "密码已修改，请重新登录。",
    });
    response.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
