import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/authorize";
import { transitionFact } from "@/lib/domain/repository";
import { apiError } from "@/lib/http/api";

const inputSchema = z.object({
  status: z.enum(["PENDING_REVIEW", "APPROVED"]),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const input = inputSchema.parse(await request.json());
    const permission =
      input.status === "APPROVED" ? "facts.approve" : "facts.submit";
    const user = await requirePermission(permission);
    const { id } = await context.params;
    return NextResponse.json({
      data: await transitionFact(user, id, input.status),
    });
  } catch (error) {
    return apiError(error);
  }
}
