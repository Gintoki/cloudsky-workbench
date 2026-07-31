import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { createMetric, listMetrics } from "@/lib/domain/repository";
import { metricInputSchema } from "@/lib/domain/validation";
import { apiError } from "@/lib/http/api";

export async function GET() {
  try {
    const user = await requirePermission("metrics.read");
    return NextResponse.json({ data: await listMetrics(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("metrics.create");
    const input = metricInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await createMetric(user, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
