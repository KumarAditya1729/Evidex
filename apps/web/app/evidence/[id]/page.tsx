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

  // Separate true cross-chain logic: Primary vs Verifiers
  const primaryAnchor = evidence.anchors.find(a => !a.verifiedChain) || evidence.anchors[0];
  const verifiers = evidence.anchors.filter(a => a.verifiedChain);

  return (
    <div className="mx-auto max-w-4xl space-y-8 fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Cryptographic Dossier</h1>
          <p className="mt-1 text-sm text-slate-500">Immutable record {evidence.id.slice(-8)}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/api/chain/tx/${evidence.chainTxHash}?chain=polkadot`} target="_blank" className="btn-secondary">
            Raw JSON Proof ↗
          </Link>
          <Link href="/dashboard" className="btn-primary">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* ── Core Evidence ──────────────────────────────── */}
      <div className="card space-y-4 border-slate-700/50">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">📄</div>
          <div>
            <h2 className="font-bold text-white text-lg">{evidence.originalFilename}</h2>
            <p className="text-xs text-slate-500">{(Number(evidence.sizeBytes) / 1024 / 1024).toFixed(3)} MB • {evidence.mimeType}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">SHA-256 Fingerprint</p>
            <p className="font-mono text-sm text-emerald-400 break-all">{evidence.sha256Hash}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner Wallet</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-blue-400 break-all">{evidence.user.walletAddress}</p>
              {evidence.user.role === "ADMIN" && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">ADMIN</span>
              )}
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Decentralized Storage (IPFS)</p>
            <p className="font-mono text-sm text-slate-300 break-all">ipfs://{evidence.ipfsCID}</p>
          </div>
        </div>
      </div>

      {/* ── True Cross-Chain Architecture ───────────────── */}
      <h2 className="text-xl font-bold text-white mt-8 mb-4">True Cross-Chain Network</h2>
      
      <div className="relative space-y-0">
        
        {/* Primary Row */}
        {primaryAnchor && (
          <div className="relative z-10 card border-emerald-500/30 bg-emerald-950/10">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Primary Source of Truth
              </span>
              <span className="text-xs text-slate-500">{new Date(primaryAnchor.anchoredAt).toLocaleString()}</span>
            </div>
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{CHAIN_LABELS[primaryAnchor.chain] ?? primaryAnchor.chain}</h3>
                <p className="font-mono text-xs text-slate-400 break-all mt-1">Tx: {primaryAnchor.txHash}</p>
              </div>
              {primaryAnchor.explorerUrl && (
                <a href={primaryAnchor.explorerUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  Verify on Explorer ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Connecting Line */}
        {verifiers.length > 0 && (
          <div className="relative my-2 ml-8 h-12 border-l-2 border-dashed border-blue-500/30">
            <div className="absolute -left-3 top-1/2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-blue-500/50 text-blue-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12h3"/></svg>
              </div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-slate-950 px-2">Cross-Chain Oracle Relay</span>
            </div>
          </div>
        )}

        {/* Verifier Rows */}
        {verifiers.map((verifier) => (
          <div key={verifier.id} className="relative z-10 card border-blue-500/30 bg-blue-950/10 ml-0 sm:ml-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                Secondary Verifier
              </span>
              <span className="text-xs text-slate-500">{new Date(verifier.anchoredAt).toLocaleString()}</span>
            </div>
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{CHAIN_LABELS[verifier.chain] ?? verifier.chain}</h3>
                <p className="font-mono text-[11px] text-slate-400 break-all mt-1">Smart Contract Tx: {verifier.txHash}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  <span className="text-blue-400/80 font-mono">Proof Payload: </span> 
                  {/* Provide visual truncating but full hash in title */}
                  <span title={verifier.crossChainProof ?? ""} className="truncate max-w-[200px] inline-block align-bottom">{verifier.crossChainProof}</span>
                </p>
              </div>
              {verifier.explorerUrl && (
                <a href={verifier.explorerUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors">
                  Verify Contract ↗
                </a>
              )}
            </div>
          </div>
        ))}

        {verifiers.length === 0 && (
          <div className="card mt-4 border-slate-800 bg-slate-900/50 text-center">
            <p className="text-sm text-slate-500">No secondary cross-chain verifications configured.</p>
          </div>
        )}

      </div>
    </div>
  );
}
