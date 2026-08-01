import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { createInvestorAccount, listInvestorCrm } from "@/lib/investor-relations/repository";
import { investorAccountSchema } from "@/lib/investor-relations/validation";

export async function GET() {
  try {
    const user = await requirePermission("investor.read");
    return NextResponse.json({ data: await listInvestorCrm(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("investor.create");
    const input = investorAccountSchema.parse(await request.json());
    return NextResponse.json(
      { data: await createInvestorAccount(user, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
