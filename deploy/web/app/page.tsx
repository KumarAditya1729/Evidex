import Link from "next/link";

const features = [
  "Username/password + wallet signature authentication",
  "SHA256 fingerprinting + IPFS decentralized storage",
  "Polkadot-first architecture for private and custom Substrate networks",
  "Verification engine and audit logs for legal-grade traceability"
];

export default function LandingPage() {
  return (
    <section className="space-y-12">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent">
            Decentralized Evidence Infrastructure
          </p>
          <h1 className="text-4xl font-bold leading-tight text-cloud md:text-6xl">
            Anchor critical evidence on-chain with global verifiability.
          </h1>
          <p className="text-base text-cloud/80 md:text-lg">
            Evidex Evidence Platform secures your documents, images, and videos with cryptographic proofs,
            immutable timestamps, and decentralized availability.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/signup" className="btn-primary">
              Create Account
            </Link>
            <Link href="/auth/signin/user" className="btn-secondary">
              User Login
            </Link>
            <Link href="/auth/signin/admin" className="btn-secondary">
              Admin Login
            </Link>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-4 text-xl font-semibold text-cloud">Why teams choose Evidex</h2>
          <ul className="space-y-3 text-sm text-cloud/80">
            {features.map((feature) => (
              <li key={feature} className="rounded-xl border border-cloud/10 bg-canvas/40 p-3">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <h3 className="text-lg font-semibold">Upload + Hash</h3>
          <p className="mt-2 text-sm text-cloud/80">Every file is fingerprinted with SHA256 before any chain operation.</p>
        </article>
        <article className="card">
          <h3 className="text-lg font-semibold">IPFS + Blockchain</h3>
          <p className="mt-2 text-sm text-cloud/80">
            Metadata goes to PostgreSQL while proof data is anchored to decentralized networks.
          </p>
        </article>
        <article className="card">
          <h3 className="text-lg font-semibold">Verify Anywhere</h3>
          <p className="mt-2 text-sm text-cloud/80">
            Recompute hash from uploaded file and validate against chain evidence in seconds.
          </p>
        </article>
      </div>
    </section>
  );
}
