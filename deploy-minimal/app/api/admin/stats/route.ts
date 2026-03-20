import { NextRequest, NextResponse } from "next/server";
import { fetchAdminDashboardStats } from "@evidex/api/admin.service";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await fetchAdminDashboardStats();
  return NextResponse.json(serializeForJson(stats));
}
