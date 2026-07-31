import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hasDatabase } from "@/db/client";
import { auditLogs, sessions, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";

const inputSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requirePermission("users.manage");
    if (!hasDatabase()) {
      return NextResponse.json(
        {
          error: "DATABASE_REQUIRED",
          message: "Demo 内存模式不修改账号状态。",
        },
        { status: 409 },
      );
    }
    const input = inputSchema.parse(await request.json());
    const { id } = await context.params;
    if (id === actor.id && input.status === "DISABLED") {
      return NextResponse.json(
        { error: "SELF_DISABLE_FORBIDDEN", message: "不能停用当前账号。" },
        { status: 409 },
      );
    }
    const db = getDb();
    const updated = await db.transaction(async (tx) => {
      const [record] = await tx
        .update(users)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(eq(users.id, id), eq(users.organizationId, actor.organizationId)),
        )
        .returning({
          id: users.id,
          email: users.email,
          status: users.status,
        });
      if (!record) return null;
      if (input.status === "DISABLED") {
        await tx
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(eq(sessions.userId, id));
      }
      await tx.insert(auditLogs).values({
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: input.status === "DISABLED" ? "DISABLE_USER" : "ENABLE_USER",
        resourceType: "USER",
        resourceId: id,
        requestId: crypto.randomUUID(),
        afterJson: record,
        metadataJson: { title: record.email },
      });
      return record;
    });
    if (!updated) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "用户不存在。" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    return apiError(error);
  }
}
