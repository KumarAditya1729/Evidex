"use client";

import { useState } from "react";

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

const CHAIN = "polkadot";

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chain", CHAIN);

      const res = await fetch("/api/evidence", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Upload failed.");
      }

      const payload = (await res.json()) as UploadResponse;
      setResponse(payload);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm text-cloud/70">Blockchain</label>
        <input className="input" value="POLKADOT (CUSTOM NETWORK)" readOnly />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-cloud/70">Evidence file</label>
        <input
          type="file"
          className="input"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Anchoring..." : "Upload & Anchor"}
      </button>

      {error ? <p className="text-sm text-signal">{error}</p> : null}

      {response ? (
        <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <p>{response.duplicate ? "Duplicate evidence detected." : "Evidence anchored successfully."}</p>
          <p>Evidence ID: {response.evidence.id}</p>
          <p>SHA256: {response.evidence.sha256Hash}</p>
          <p>IPFS CID: {response.evidence.ipfsCID}</p>
          <p>Tx Hash: {response.evidence.chainTxHash}</p>
          <p>Chain: {response.evidence.chain}</p>
        </div>
      ) : null}
    </form>
  );
}
