import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { getComparableMarketData } from "@/lib/market-data/comparables";
import { apiError } from "@/lib/http/api";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("metrics.read");
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    return NextResponse.json({
      data: await getComparableMarketData({ forceRefresh }),
    });
  } catch (error) {
    return apiError(error);
  }
}
