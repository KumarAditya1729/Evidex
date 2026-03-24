"use client";

import { useState, useRef } from "react";

interface VerificationResponse {
  hashHex: string;
  chain: string;
  isValid: boolean;
  evidence?: {
    id: string;
    ipfsCID: string;
    chainTxHash: string;
  };
  chainVerification: {
    exists: boolean;
    txHash?: string;
    timestamp?: number;
  };
}

export function VerifyForm() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [chain, setChain] = useState("auto");
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file && !hash.trim()) {
      setError("Provide a local evidence file or its strictly formatted SHA-256 fingerprint.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (chain !== "auto") formData.append("chain", chain);
      if (file) formData.append("file", file);
      if (hash.trim()) formData.append("hash", hash.trim());

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Cryptographic verification simulation failed.");
      }

      setResult((await response.json()) as VerificationResponse);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Node synchronization or network verification failure.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const downloadReceipt = () => {
    if (!result) return;
    
    // Clean, portable JSON receipt architecture for verifiable credentials
    const receiptPayload = {
      "@context": "https://w3id.org/security/v1",
      type: ["VerifiableCredential", "BlockchainEvidenceReceipt"],
      issuer: "EVIDEX Cryptographic Subsystem",
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        status: result.isValid ? "VERIFIED_AUTHENTIC" : "UNVERIFIED",
        cryptographicHash: result.hashHex,
        blockchainNetwork: result.chain,
        blockFinalityConfirmed: result.chainVerification.exists,
        transactionSignature: result.chainVerification.txHash || "UNAVAILABLE",
        originalIpfsPayloadID: result.evidence?.ipfsCID || "UNAVAILABLE"
      }
    };

    const blob = new Blob([JSON.stringify(receiptPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidex-receipt-${result.hashHex.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* 📋 1. AUDIT LOOKUP FORM */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl backdrop-blur">
        <h2 className="mb-6 text-xl font-bold text-white">Cryptographic Verification Engine</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* File Drop Zone for Hashing */}
          <div 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${file ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) setFile(e.target.files[0]);
              }} 
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="mb-2 text-3xl text-blue-400">📄</div>
                <h4 className="font-bold text-white truncate max-w-[200px]">{file.name}</h4>
                <p className="text-xs text-slate-400">Local Validation Ready</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl text-slate-400 group-hover:scale-110 mb-1">➕</div>
                <h4 className="text-sm font-bold text-slate-300">Drop Original File Here</h4>
                <p className="text-xs text-slate-500">to recompute SHA-256 fingerprint</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Extrinsic Network</label>
              <select 
                value={chain} 
                onChange={(e) => setChain(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="auto">🌐 Multi-Chain Discovery (Scan All)</option>
                <option value="polkadot">🟣 Polkadot Native</option>
                <option value="polygon">💜 Polygon Layer-2</option>
                <option value="arbitrum">💙 Arbitrum One</option>
                <option value="ethereum">💎 Ethereum Mainnet</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manual SHA-256 Fingerprint</label>
              <input
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-mono text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e3b0c44298fc1c149afbf4c8996fb924..."
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || (!file && !hash.trim())}
          className="mt-8 w-full rounded-xl bg-slate-100 py-4 text-sm font-bold text-slate-900 shadow-xl transition-all hover:bg-white active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-100 disabled:active:scale-100"
        >
          {isSubmitting ? "Querying Substrate & RPC Nodes..." : "Audit & Verify Decentralized Network"}
        </button>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm font-semibold text-red-400">
            ⚠️ {error}
          </div>
        )}
      </form>

      {/* ✅ 2. EXPLICIT AUDIT CERTIFICATE DASHBOARD */}
      {result && (
        <div className={`relative overflow-hidden rounded-2xl border ${result.isValid ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-red-500/50 bg-red-900/10'} p-8 shadow-2xl backdrop-blur-sm transition-all duration-700 animate-in fade-in slide-in-from-bottom-8`}>
          
          {/* Certificate Corner Ribbons */}
          {result.isValid && (
             <div className="absolute -right-12 top-6 rotate-45 bg-emerald-500/80 px-12 py-1 text-xs font-bold tracking-widest text-emerald-950 shadow-sm">
               CERTIFIED
             </div>
          )}

          <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${result.isValid ? 'bg-emerald-500/20 text-emerald-400 text-3xl' : 'bg-red-500/20 text-red-400 text-3xl'}`}>
              {result.isValid ? "🟢" : "🔴"}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {result.isValid ? "Integrity Status: VERIFIED" : "Integrity Status: NOT FOUND"}
              </h3>
              <p className={`text-sm ${result.isValid ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                {result.isValid ? "Cryptographic consensus achieved." : "No matching hash discovered on selected ledgers."}
              </p>
            </div>
          </div>

          {result.isValid ? (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <p className="text-xs tracking-wider text-slate-500">Blockchain Network</p>
                  <p className="font-mono font-bold text-blue-400 mt-1 uppercase">{result.chain}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <p className="text-xs tracking-wider text-slate-500">Transaction Finality</p>
                  <p className="font-mono font-bold text-emerald-400 mt-1">Confirmed In Block</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/40 p-5 space-y-3 font-mono">
                <div>
                  <p className="text-xs text-slate-500">SHA-256 Checksum Payload</p>
                  <p className="text-slate-300 break-all">{result.hashHex}</p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-slate-500">Extrinsic Tx Hash (Signature)</p>
                  <p className="text-slate-300 break-all">{result.chainVerification.txHash}</p>
                </div>
                {result.evidence?.ipfsCID && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">IPFS Decentralized Media</p>
                      <p className="text-emerald-400">ipfs://{result.evidence.ipfsCID}</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={downloadReceipt}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-4 font-bold text-emerald-400 transition hover:bg-emerald-500/30 border border-emerald-500/30"
              >
                <span className="text-xl">⬇️</span> Download Cryptographic JSON Receipt
              </button>

            </div>
          ) : (
             <div className="rounded-xl border border-red-500/20 bg-black/40 p-5 font-mono text-sm text-red-200">
               <p className="font-bold mb-2">Diagnostic Output:</p>
               <p className="break-all opacity-70">Target Hash: {result.hashHex || "null"}</p>
               <p className="mt-2 opacity-70">The cryptographic node successfully parsed the query but failed to locate an immutable mapping on the selected distributed ledger architecture.</p>
             </div>
          )}

        </div>
      )}

    </div>
  );
}
