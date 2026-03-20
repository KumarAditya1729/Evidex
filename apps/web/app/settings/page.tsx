import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="card space-y-3">
        <p className="text-sm text-cloud/60">Username</p>
        <p className="text-sm">{session.name ?? "Not set"}</p>
        <p className="text-sm text-cloud/60">Connected Wallet</p>
        <p className="font-mono text-sm">{session.walletAddress}</p>
        <p className="text-sm text-cloud/60">Role</p>
        <p className="text-sm">{session.role}</p>
      </div>
    </section>
  );
}
