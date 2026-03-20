import { VerifyForm } from "@/components/verify-form";

export default function VerifyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Verification Engine</h1>
      <p className="text-cloud/75">
        Upload a file or provide a SHA256 hash to compare the fingerprint against proofs anchored on your Polkadot chain.
      </p>
      <VerifyForm />
    </section>
  );
}
