import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEvidenceById } from "@evidex/database";
import { getSessionFromCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

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
        <p>
          <span className="text-cloud/60">Chain:</span> {evidence.chain}
        </p>
        <p>
          <span className="text-cloud/60">Tx Hash:</span> <span className="font-mono">{evidence.chainTxHash}</span>
        </p>
      </div>
      {evidence.anchors[0]?.explorerUrl ? (
        <a href={evidence.anchors[0].explorerUrl} target="_blank" className="btn-primary inline-flex" rel="noreferrer">
          Open on Explorer
        </a>
      ) : null}
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
    </section>
  );
}
