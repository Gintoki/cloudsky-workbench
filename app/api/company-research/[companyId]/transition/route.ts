import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { transitionCompanyResearch } from "@/lib/company-research/repository";
import { researchTransitionSchema } from "@/lib/company-research/validation";
import { apiError } from "@/lib/http/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const payload = researchTransitionSchema.parse(await request.json());
    const permission = payload.action === "SUBMIT" ? "research.submit" : "research.approve";
    const user = await requirePermission(permission);
    const { companyId } = await params;
    return NextResponse.json({
      data: await transitionCompanyResearch(user, companyId, payload),
    });
  } catch (error) {
    return apiError(error);
  }
}
