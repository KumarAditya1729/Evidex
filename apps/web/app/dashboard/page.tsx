import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import UserAnalyticsDashboard from "@/components/user-analytics-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  const shortAddr = `${session.walletAddress.slice(0, 6)}...${session.walletAddress.slice(-4)}`;

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="status-dot-green" />
            <span className="text-xs text-emerald-400 font-medium">Connected: {shortAddr}</span>
            {session.role === "ADMIN" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                ★ Admin
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-white">Evidence Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your blockchain-anchored evidence records</p>
        </div>
        <div className="flex gap-3">
          <Link href="/verify" className="btn-secondary">
            Verify a File
          </Link>
          <Link href="/upload" className="btn-primary">
            + Upload Evidence
          </Link>
        </div>
      </div>

      <div className="divider" />

      <UserAnalyticsDashboard />
    </div>
  );
}
