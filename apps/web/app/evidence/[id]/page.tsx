import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEvidenceById } from "@evidex/database";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

const CHAIN_LABELS: Record<string, string> = {
  POLKADOT: "🟣 Polkadot",
  ETHEREUM: "🔵 Ethereum Sepolia",
  POLYGON: "🟣 Polygon",
  BITCOIN: "🟠 Bitcoin"
};

export default async function EvidenceDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  const evidence = await getEvidenceById(params.id);
  if (!evidence) {
    notFound();
  }

  const isOwner = evidence.user.walletAddress === session.walletAddress;
  if (!isOwner && session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Evidence Details</h1>
      <div className="card space-y-3 text-sm">
        <p>
          <span className="text-cloud/60">File:</span> {evidence.originalFilename}
        </p>
        <p>
          <span className="text-cloud/60">Owner:</span> {evidence.user.walletAddress}
        </p>
        <p>
          <span className="text-cloud/60">Owner Role:</span> {evidence.user.role}
        </p>
        <p>
          <span className="text-cloud/60">Hash:</span> <span className="font-mono">{evidence.sha256Hash}</span>
        </p>
        <p>
          <span className="text-cloud/60">IPFS CID:</span> <span className="font-mono">{evidence.ipfsCID}</span>
        </p>
      </div>

      {/* Multi-Chain Anchors */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">⛓️ Chain Proofs ({evidence.anchors.length})</h2>
        {evidence.anchors.length === 0 ? (
          <p className="text-sm text-cloud/60">No chain anchors found.</p>
        ) : (
          <div className="grid gap-3">
            {evidence.anchors.map((anchor) => (
              <div key={anchor.id} className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{CHAIN_LABELS[anchor.chain] ?? anchor.chain}</p>
                  <p className="font-mono text-xs text-cloud/70 break-all">Tx: {anchor.txHash}</p>
                  <p className="text-xs text-cloud/60">
                    Anchored: {new Date(anchor.anchoredAt).toLocaleString()}
                  </p>
                </div>
                {anchor.explorerUrl ? (
                  <a
                    href={anchor.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary whitespace-nowrap"
                  >
                    Open Block ↗
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/chain/tx/${evidence.chainTxHash}?chain=polkadot`}
          target="_blank"
          className="btn-secondary inline-flex"
          rel="noreferrer"
        >
          Live Chain Proof (JSON)
        </a>
        <Link href="/dashboard" className="btn-secondary inline-flex">
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
