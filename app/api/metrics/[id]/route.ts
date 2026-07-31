import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { updateMetric } from "@/lib/domain/repository";
import { metricInputSchema } from "@/lib/domain/validation";
import { apiError } from "@/lib/http/api";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requirePermission("metrics.update");
    const input = metricInputSchema.parse(await request.json());
    const { id } = await context.params;
    return NextResponse.json({ data: await updateMetric(user, id, input) });
  } catch (error) {
    return apiError(error);
  }
}
