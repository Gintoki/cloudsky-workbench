import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { getResearchItem, updateResearchItem } from "@/lib/research-knowledge/repository";
import { researchItemInputSchema } from "@/lib/research-knowledge/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  try {
    const user = await requirePermission("research.read");
    const { id } = await context.params;
    const item = await getResearchItem(user, id);
    if (!item) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "未找到该研究条目。" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: item });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requirePermission("research.update");
    const { id } = await context.params;
    const input = researchItemInputSchema.parse(await request.json());
    return NextResponse.json({ data: await updateResearchItem(user, id, input) });
  } catch (error) {
    return apiError(error);
  }
}
