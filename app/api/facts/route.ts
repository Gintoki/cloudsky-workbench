import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { createFact, listFacts } from "@/lib/domain/repository";
import { factInputSchema } from "@/lib/domain/validation";
import { apiError } from "@/lib/http/api";

export async function GET() {
  try {
    const user = await requirePermission("facts.read");
    return NextResponse.json({ data: await listFacts(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("facts.create");
    const input = factInputSchema.parse(await request.json());
    return NextResponse.json(
      { data: await createFact(user, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
