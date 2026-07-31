import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hasDatabase } from "@/db/client";
import { auditLogs, roles, userRoles, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth/authorize";
import { demoUsers } from "@/lib/auth/demo-users";
import { apiError } from "@/lib/http/api";

const inviteSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLocaleLowerCase()),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(["ADMINISTRATOR", "DIRECTOR", "ANALYST", "VIEWER"]),
  temporaryPassword: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

export async function GET() {
  try {
    const actor = await requirePermission("users.manage");
    if (!hasDatabase()) {
      return NextResponse.json({
        data: demoUsers.map((user) => ({ ...user, status: "ACTIVE" })),
      });
    }
    const data = await getDb()
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        role: roles.code,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(users.organizationId, actor.organizationId));
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("users.manage");
    if (!hasDatabase()) {
      return NextResponse.json(
        {
          error: "DATABASE_REQUIRED",
          message: "Demo 内存模式不创建账号；连接 PostgreSQL 后可使用邀请接口。",
        },
        { status: 409 },
      );
    }
    const input = inviteSchema.parse(await request.json());
    const db = getDb();
    const created = await db.transaction(async (tx) => {
      const [role] = await tx
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.code, input.role),
            eq(roles.organizationId, actor.organizationId),
          ),
        )
        .limit(1);
      if (!role || role.organizationId !== actor.organizationId) {
        throw new Error("Role not found.");
      }
      const [user] = await tx
        .insert(users)
        .values({
          organizationId: actor.organizationId,
          email: input.email,
          displayName: input.displayName,
          passwordHash: await bcrypt.hash(input.temporaryPassword, 12),
          status: "INVITED",
          invitedBy: actor.id,
          invitedAt: new Date(),
        })
        .returning({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          status: users.status,
        });
      await tx.insert(userRoles).values({
        userId: user.id,
        roleId: role.id,
        createdBy: actor.id,
      });
      await tx.insert(auditLogs).values({
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "INVITE_USER",
        resourceType: "USER",
        resourceId: user.id,
        requestId: crypto.randomUUID(),
        afterJson: { ...user, role: role.code },
        metadataJson: { title: user.email },
      });
      return { ...user, role: role.code };
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
