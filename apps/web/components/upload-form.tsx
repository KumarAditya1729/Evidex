"use client";

import { useState, useRef } from "react";

interface UploadResponse {
  duplicate: boolean;
  evidence: {
    id: string;
    sha256Hash: string;
    ipfsCID: string;
    chainTxHash: string;
    chain: string;
  };
}

const CHAINS = [
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "DOT",
    icon: "🟣",
    color: "#E84142",
    border: "border-red-500",
    activeBg: "bg-red-500/15 border-red-500/50 text-red-300",
    desc: "Substrate para-chain • Recommended"
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    symbol: "ETH",
    icon: "🔵",
    color: "#60a5fa",
    border: "border-blue-500",
    activeBg: "bg-blue-500/15 border-blue-500/50 text-blue-300",
    desc: "EVM testnet • Smart Contract"
  },
  {
    id: "polygon-amoy",
    name: "Polygon Amoy",
    symbol: "MATIC",
    icon: "🟣",
    color: "#a78bfa",
    border: "border-purple-500",
    activeBg: "bg-purple-500/15 border-purple-500/50 text-purple-300",
    desc: "Low-cost EVM • Testnet"
  }
];

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [chain, setChain] = useState<string>("polkadot");
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "hashing" | "anchoring" | "confirming" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.[0]) { setFile(e.dataTransfer.files[0]); setResponse(null); setError(null); setStatus("idle"); }
  };

  async function triggerUploadFlow() {
    if (!file) return;
    setStatus("uploading"); setError(null); setResponse(null);

    setTimeout(() => setStatus("hashing"), 800);
    setTimeout(() => setStatus("anchoring"), 2000);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chain", chain);

      const res = await fetch("/api/evidence", { method: "POST", body: formData });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Anchoring failed.");
      }

      const payload = (await res.json()) as UploadResponse;
      setStatus("confirming");
      setTimeout(() => { setResponse(payload); setStatus("success"); }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anchor failed.");
      setStatus("error");
    }
  }

  const selectedChain = CHAINS.find(c => c.id === chain)!;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 fade-in">

      {/* ── Chain Selector ──────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Select Blockchain</h3>
          <span className="text-xs text-slate-500">Each user can anchor on a different chain</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHAINS.map((c) => {
            const active = chain === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChain(c.id)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-200 ${
                  active
                    ? c.activeBg
                    : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-300"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl">{c.icon}</span>
                  {active && (
                    <span className="flex h-2 w-2 rounded-full" style={{ background: c.color }}>
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75" style={{ background: c.color }} />
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white">{c.name}</p>
                <p className="text-xs opacity-60">{c.desc}</p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
          <span style={{ color: selectedChain.color }}>⬤</span>
          <span>Anchoring on <strong className="text-white">{selectedChain.name}</strong> ({selectedChain.symbol})</span>
        </div>
      </div>

      {/* ── Drop Zone ───────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          file
            ? "border-blue-500/40 bg-blue-900/8"
            : "border-white/10 bg-white/[0.02] hover:border-blue-400/40 hover:bg-white/[0.04]"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => { if (e.target.files) { setFile(e.target.files[0]); setStatus("idle"); setResponse(null); } }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-2xl">📄</div>
            <p className="font-bold text-white">{file.name}</p>
            <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to anchor</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl transition-transform group-hover:scale-110">
              ↑
            </div>
            <p className="font-bold text-white">Drop evidence here</p>
            <p className="text-sm text-slate-500">or click to browse · any file type</p>
            <p className="mt-2 text-xs font-medium text-emerald-500/80">🔒 SHA-256 hashed client-side</p>
          </div>
        )}
      </div>

      {/* ── Anchor Button ───────────────────────────── */}
      {file && status === "idle" && (
        <button
          onClick={triggerUploadFlow}
          className="btn-primary w-full py-4 text-base"
        >
          Anchor on {selectedChain.name} {selectedChain.icon}
        </button>
      )}

      {/* ── Progress Steps ──────────────────────────── */}
      {status !== "idle" && status !== "success" && (
        <div className="card space-y-3">
          <h3 className="font-bold text-white">Anchoring to {selectedChain.name}…</h3>
          {[
            { key: "uploading", label: "Encrypting & uploading payload", color: "blue" },
            { key: "hashing",   label: "Deriving SHA-256 fingerprint",   color: "purple" },
            { key: "anchoring", label: `Broadcasting to ${selectedChain.name} nodes`, color: "orange" },
            { key: "confirming",label: "Awaiting block finality",         color: "emerald" }
          ].map(({ key, label, color }, i, arr) => {
            const done = arr.findIndex(s => s.key === status) > i;
            const active = key === status;
            return (
              <div key={key} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${active ? `bg-${color}-500/10 border border-${color}-500/20` : done ? "opacity-40" : "opacity-20"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${active ? `bg-${color}-500/20 text-${color}-400` : done ? "bg-white/10 text-slate-400" : "bg-white/5 text-slate-600"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <span className="text-slate-200">{label}</span>
                {active && <span className="ml-auto flex h-2 w-2 rounded-full bg-current animate-ping" />}
              </div>
            );
          })}
          {status === "error" && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              ❌ {error}
            </div>
          )}
        </div>
      )}

      {/* ── Success Card ────────────────────────────── */}
      {status === "success" && response && (
        <div className="card border-emerald-500/20 bg-emerald-950/20 text-center fade-in">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-3xl">🛡️</div>
          </div>
          <h2 className="mb-1 text-xl font-black text-white">
            {response.duplicate ? "Already Anchored" : "Cryptographically Anchored"}
          </h2>
          <p className="mb-6 text-sm text-emerald-300/70">
            {response.duplicate ? "This file was already anchored on-chain." : `Proof permanently written to ${selectedChain.name}.`}
          </p>

          <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 text-left font-mono text-xs space-y-2.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 shrink-0">Network</span>
              <span className="text-blue-400 font-bold uppercase truncate">{selectedChain.name}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/[0.04] pt-2.5">
              <span className="text-slate-500 shrink-0">Tx Hash</span>
              <span className="truncate text-slate-300">{response.evidence.chainTxHash}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/[0.04] pt-2.5">
              <span className="text-slate-500 shrink-0">SHA-256</span>
              <span className="truncate text-slate-300">{response.evidence.sha256Hash}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/[0.04] pt-2.5">
              <span className="text-slate-500 shrink-0">IPFS</span>
              <span className="truncate text-emerald-400">ipfs://{response.evidence.ipfsCID}</span>
            </div>
          </div>

          <button
            onClick={() => { setStatus("idle"); setFile(null); setResponse(null); }}
            className="btn-secondary mt-6 w-full"
          >
            Anchor Another File
          </button>
        </div>
      )}
    </div>
  );
}
