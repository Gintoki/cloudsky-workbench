import { NextResponse } from "next/server";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/authorize";
import { ZodError } from "zod";

export function apiError(error: unknown): NextResponse {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "请先登录。" },
      { status: 401 },
    );
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "当前账号没有执行此操作的权限。" },
      { status: 403 },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "提交的数据不符合要求。",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "INTERNAL_ERROR", message: "服务暂时不可用，请稍后重试。" },
    { status: 500 },
  );
}
