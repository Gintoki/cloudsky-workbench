import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { updateFact } from "@/lib/domain/repository";
import { factInputSchema } from "@/lib/domain/validation";
import { apiError } from "@/lib/http/api";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requirePermission("facts.update");
    const input = factInputSchema.parse(await request.json());
    const { id } = await context.params;
    return NextResponse.json({ data: await updateFact(user, id, input) });
  } catch (error) {
    return apiError(error);
  }
}
