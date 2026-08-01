import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { createResearchItem, listResearchItems } from "@/lib/research-knowledge/repository";
import { researchItemInputSchema } from "@/lib/research-knowledge/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission("research.read");
    const query = request.nextUrl.searchParams;
    const daysValue = query.get("days");
    const days = daysValue ? Number(daysValue) : undefined;
    return NextResponse.json({
      data: await listResearchItems(user, {
        dimension: (query.get("dimension") ?? undefined) as
          | "MARKET"
          | "TECHNOLOGY"
          | "BUSINESS_MODEL"
          | undefined,
        status: query.get("status") ?? undefined,
        days: days && [7, 30].includes(days) ? days : undefined,
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("research.create");
    const input = researchItemInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await createResearchItem(user, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
