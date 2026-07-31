import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { listAudits } from "@/lib/domain/repository";
import { apiError } from "@/lib/http/api";

export async function GET() {
  try {
    const user = await requirePermission("audit.read");
    return NextResponse.json({ data: await listAudits(user) });
  } catch (error) {
    return apiError(error);
  }
}
