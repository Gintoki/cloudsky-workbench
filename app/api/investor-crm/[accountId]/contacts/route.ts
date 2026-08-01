import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { apiError } from "@/lib/http/api";
import { createInvestorContact } from "@/lib/investor-relations/repository";
import { investorContactSchema } from "@/lib/investor-relations/validation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ accountId: string }> },
) {
  try {
    const user = await requirePermission("investor.update");
    const { accountId } = await context.params;
    const input = investorContactSchema.parse(await request.json());
    return NextResponse.json(
      { data: await createInvestorContact(user, accountId, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
