import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { getAgentConversation } from "@/lib/research-agent/repository";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const user = await requirePermission("agent.read");
    const { conversationId } = await context.params;
    const conversation = await getAgentConversation(user, conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "未找到此个人问答会话。" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: conversation });
  } catch (error) {
    return apiError(error);
  }
}
