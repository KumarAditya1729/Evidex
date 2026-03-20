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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Evidence Dashboard</h1>
        <Link href="/upload" className="btn-primary w-fit">
          Upload New Evidence
        </Link>
      </div>

      <UserAnalyticsDashboard />
    </section>
  );
}
