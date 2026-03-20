import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import AdminAnalyticsDashboard from "@/components/admin-analytics-dashboard-v2";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminAnalyticsDashboard />;
}
