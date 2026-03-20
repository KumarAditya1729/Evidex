import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import ChainManagementDashboard from "@/components/chain-management-dashboard";

export const dynamic = "force-dynamic";

export default async function ChainManagementPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <ChainManagementDashboard />;
}
