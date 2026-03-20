import Link from "next/link";
import { redirect } from "next/navigation";
import { SigninForm } from "@/components/signin-form";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UserSigninPage() {
  const session = await getSessionFromCookies();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <section className="space-y-6">
      <SigninForm role="USER" />
      <p className="text-center text-sm text-cloud/70">
        Are you an admin?{" "}
        <Link href="/auth/signin/admin" className="text-accent hover:underline">
          Use admin login
        </Link>
        .
      </p>
    </section>
  );
}
