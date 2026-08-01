import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import {
  createCompanyResearch,
  listCompanyResearch,
} from "@/lib/company-research/repository";
import { createResearchReportSchema } from "@/lib/company-research/validation";
import { apiError } from "@/lib/http/api";

export async function GET() {
  try {
    const user = await requirePermission("research.read");
    return NextResponse.json({ data: await listCompanyResearch(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("research.create");
    const input = createResearchReportSchema.parse(await request.json());
    return NextResponse.json(
      { data: await createCompanyResearch(user, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
