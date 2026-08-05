import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { AgentConfigurationError, AgentProviderError, AgentRateLimitError, answerResearchQuestion, getResearchAgentStatus } from "@/lib/research-agent/service";
import { listAgentConversations, saveAgentExchange } from "@/lib/research-agent/repository";

const inputSchema = z.object({
  question: z.string().trim().min(2).max(2_000),
  conversationId: z.string().uuid().optional(),
  model: z.enum(["qwen3.7-plus", "qwen3.8-max", "qwen3.7-plus-2026-05-26"]).optional(),
});

export async function GET() {
  try {
    const user = await requirePermission("agent.read");
    return NextResponse.json({
      data: {
        ...getResearchAgentStatus(),
        conversations: await listAgentConversations(user),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("agent.read");
    const { question, conversationId, model } = inputSchema.parse(await request.json());
    const answer = await answerResearchQuestion(user, question, model);
    const conversation = await saveAgentExchange(user, {
      conversationId,
      question,
      answer: answer.answer,
      citations: answer.citations,
      model: answer.model,
    });
    return NextResponse.json({ data: { ...answer, conversation } });
  } catch (error) {
    if (error instanceof AgentConfigurationError) return NextResponse.json({ error: "AGENT_NOT_CONFIGURED", message: error.message }, { status: 503 });
    if (error instanceof AgentRateLimitError) return NextResponse.json({ error: "RATE_LIMITED", message: error.message }, { status: 429 });
    if (error instanceof AgentProviderError) return NextResponse.json({ error: "AGENT_UNAVAILABLE", message: error.message }, { status: 502 });
    return apiError(error);
  }
}
