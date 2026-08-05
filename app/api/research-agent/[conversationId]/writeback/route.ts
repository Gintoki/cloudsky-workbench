import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { writeAgentAnswerToResearch } from "@/lib/research-agent/writeback";

const inputSchema = z.object({
  messageId: z.string().uuid(),
  dimension: z.enum(["MARKET", "TECHNOLOGY", "BUSINESS_MODEL"]),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const user = await requirePermission("agent.writeback");
    const { conversationId } = await context.params;
    const input = inputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await writeAgentAnswerToResearch(user, { conversationId, ...input }) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
