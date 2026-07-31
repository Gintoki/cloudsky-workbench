import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { getIntelligenceItem } from "@/lib/intelligence/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requirePermission("intelligence.read");
    const { id } = await context.params;
    const item = await getIntelligenceItem(user, id);
    if (!item) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "未找到该行业动态。" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: item });
  } catch (error) {
    return apiError(error);
  }
}
