import { NextRequest, NextResponse } from "next/server";
import { chainConfigurationService } from "@evidex/blockchain";
import { getSessionFromRequest } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeChains = chainConfigurationService.getActiveChains();
    return NextResponse.json(activeChains);
  } catch (error) {
    console.error("Error fetching active chains:", error);
    return NextResponse.json(
      { error: "Failed to fetch active chains" },
      { status: 500 }
    );
  }
}
