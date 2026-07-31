import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, recordLoginAttempt } from "@/lib/auth/provider";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { apiError } from "@/lib/http/api";

const inputSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLocaleLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const user = await authenticateUser(input.email, input.password);
    await recordLoginAttempt({
      email: input.email,
      user,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    });
    if (!user) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "邮箱或密码不正确。" },
        { status: 401 },
      );
    }
    const response = NextResponse.json({ user });
    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken(user),
      sessionCookieOptions(),
    );
    return response;
  } catch (error) {
    return apiError(error);
  }
}
