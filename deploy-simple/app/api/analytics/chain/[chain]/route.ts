import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsService } from "@evidex/blockchain";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { chain } = params;

  try {
    const analyticsService = await getAnalyticsService();
    const proofStatus = await analyticsService.monitorChainProofStatus(chain);
    
    return NextResponse.json(serializeForJson(proofStatus as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Error monitoring chain proof status:", error);
    return NextResponse.json(
      { error: "Failed to monitor chain proof status" },
      { status: 500 }
    );
  }
}
