import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SigninPage() {
  const session = await getSessionFromCookies();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="card space-y-4">
        <h1 className="text-3xl font-bold">Choose Login Type</h1>
        <p className="text-sm text-cloud/70">Use separate login portals for admins and users.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/auth/signin/user" className="btn-secondary text-center">
            User Login
          </Link>
          <Link href="/auth/signin/admin" className="btn-primary text-center">
            Admin Login
          </Link>
        </div>
      </div>
      <p className="text-center text-sm text-cloud/70">
        Need a user account?{" "}
        <Link href="/auth/signup" className="text-accent hover:underline">
          Create one
        </Link>
        .
      </p>
    </section>
  );
}
