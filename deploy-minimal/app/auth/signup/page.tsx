import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getSessionFromCookies();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <section className="space-y-6">
      <SignupForm />
      <p className="text-center text-sm text-cloud/70">
        Already registered?{" "}
        <Link href="/auth/signin" className="text-accent hover:underline">
          Sign in here
        </Link>
        .
      </p>
    </section>
  );
}
