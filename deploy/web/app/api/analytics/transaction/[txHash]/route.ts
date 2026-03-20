import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsService } from "@evidex/blockchain";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { txHash } = params;
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain');

  if (!chain) {
    return NextResponse.json({ error: "Chain parameter is required" }, { status: 400 });
  }

  try {
    const analyticsService = await getAnalyticsService();
    const healthMetrics = await analyticsService.monitorTransactionHealth(txHash, chain);
    
    return NextResponse.json(serializeForJson(healthMetrics as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Error monitoring transaction health:", error);
    return NextResponse.json(
      { error: "Failed to monitor transaction health" },
      { status: 500 }
    );
  }
}
