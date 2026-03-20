import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsService } from "@evidex/blockchain";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analyticsService = await getAnalyticsService();
    const metrics = await analyticsService.collectMetrics();
    
    return NextResponse.json(serializeForJson(metrics as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Error fetching analytics metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics metrics" },
      { status: 500 }
    );
  }
}
