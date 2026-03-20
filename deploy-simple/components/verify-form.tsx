"use client";

import { useState } from "react";

const CHAIN = "polkadot";

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
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file && !hash.trim()) {
      setError("Provide either a file or SHA256 hash.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("chain", CHAIN);
      if (file) {
        formData.append("file", file);
      }
      if (hash.trim()) {
        formData.append("hash", hash.trim());
      }

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Verification failed.");
      }

      setResult((await response.json()) as VerificationResponse);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-cloud/70">Chain</label>
          <input className="input" value="POLKADOT (CUSTOM NETWORK)" readOnly />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-cloud/70">SHA256 Hash (optional)</label>
          <input
            value={hash}
            onChange={(event) => setHash(event.target.value)}
            className="input"
            placeholder="e3b0c44298fc1c149afbf4c8996fb..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-cloud/70">File (optional)</label>
        <input
          type="file"
          className="input"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Verifying..." : "Verify Evidence"}
      </button>

      {error ? <p className="text-sm text-signal">{error}</p> : null}

      {result ? (
        <div className="space-y-2 rounded-xl border border-cloud/20 bg-canvas/70 p-4 text-sm">
          <p className={result.isValid ? "text-accent" : "text-signal"}>
            {result.isValid ? "Authentic evidence verified" : "Evidence not verified"}
          </p>
          <p>Hash: {result.hashHex}</p>
          <p>On-chain found: {result.chainVerification.exists ? "Yes" : "No"}</p>
          {result.chainVerification.txHash ? <p>Tx: {result.chainVerification.txHash}</p> : null}
          {result.evidence ? <p>IPFS CID: {result.evidence.ipfsCID}</p> : null}
        </div>
      ) : null}
    </form>
  );
}
