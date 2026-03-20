import { redirect } from "next/navigation";
import { UploadForm } from "@/components/upload-form";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Upload Evidence</h1>
      <p className="text-cloud/75">
        Upload files, generate cryptographic fingerprints, pin to IPFS, and anchor proof on your custom Polkadot network.
      </p>
      <UploadForm />
    </section>
  );
}
