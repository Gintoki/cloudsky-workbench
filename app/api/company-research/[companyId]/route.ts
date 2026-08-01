import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import {
  getCompanyResearch,
  updateCompanyResearch,
} from "@/lib/company-research/repository";
import { updateResearchReportSchema } from "@/lib/company-research/validation";
import { apiError } from "@/lib/http/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const user = await requirePermission("research.read");
    const { companyId } = await params;
    const data = await getCompanyResearch(user, companyId);
    if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const user = await requirePermission("research.update");
    const { companyId } = await params;
    const input = updateResearchReportSchema.parse(await request.json());
    return NextResponse.json({ data: await updateCompanyResearch(user, companyId, input) });
  } catch (error) {
    return apiError(error);
  }
}
