import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { listIntelligence } from "@/lib/intelligence/repository";
import { intelligenceQuerySchema } from "@/lib/intelligence/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission("intelligence.read");
    const query = intelligenceQuerySchema.parse({
      category: request.nextUrl.searchParams.get("category") || undefined,
      company: request.nextUrl.searchParams.get("company") || undefined,
      sort: request.nextUrl.searchParams.get("sort") || undefined,
    });
    return NextResponse.json({
      data: await listIntelligence(user, query),
    });
  } catch (error) {
    return apiError(error);
  }
}
