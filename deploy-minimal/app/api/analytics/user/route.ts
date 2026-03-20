import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsService } from "@evidex/blockchain";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";
import { listEvidenceByUser } from "@evidex/database";

// Import EvidenceStatus enum - this would need to be adjusted based on actual package structure
type EvidenceStatus = 'Pending' | 'Verified' | 'Rejected';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's evidence records
    const userEvidences = await listEvidenceByUser(session.walletAddress);
    
    // Calculate user-specific metrics
    const evidenceMetrics = {
      total: userEvidences.length,
      verified: userEvidences.filter(e => (e.status as string) === 'Verified').length,
      failed: userEvidences.filter(e => (e.status as string) === 'Rejected').length,
      pending: userEvidences.filter(e => (e.status as string) === 'Pending').length,
    };

    // Get transaction metrics for user's evidence
    const transactionMetrics = {
      total: userEvidences.filter(e => e.anchors.length > 0).length,
      successful: userEvidences.filter(e => (e.status as string) === 'Verified' && e.anchors.length > 0).length,
      failed: userEvidences.filter(e => (e.status as string) === 'Rejected' && e.anchors.length > 0).length,
      pending: userEvidences.filter(e => (e.status as string) === 'Pending' && e.anchors.length > 0).length,
      averageConfirmationTime: 0, // Would calculate from actual timestamps
    };

    // Create recent activity feed
    const recentActivity = userEvidences.slice(0, 10).map(evidence => ({
      id: evidence.id,
      type: 'evidence_uploaded' as const,
      timestamp: evidence.createdAt,
      status: (evidence.status as string).toLowerCase(),
      details: `Uploaded ${evidence.originalFilename} on ${evidence.anchors[0]?.chain || 'Unknown'}`,
    }));

    const userAnalytics = {
      evidence: evidenceMetrics,
      transactions: transactionMetrics,
      recentActivity,
    };
    
    return NextResponse.json(serializeForJson(userAnalytics as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch user analytics" },
      { status: 500 }
    );
  }
}
