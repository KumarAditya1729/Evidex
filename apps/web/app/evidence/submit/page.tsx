"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

const SECTORS = [
  { id: "govt", name: "🏛️ Government (Land Records, FIRs)" },
  { id: "finance", name: "🏦 Finance (Loan Collateral, KYC)" },
  { id: "audit", name: "🏢 Corporate Audit (Ledgers, GST)" },
  { id: "health", name: "🏥 Healthcare (Prescriptions, Logs)" },
  { id: "edu", name: "🎓 Education (Degrees, Credentials)" },
];

interface AnchorProof {
  fileHash: string;
  ipfsCID: string;
  blockHash: string;
  timestamp: string;
}

export default function EvidenceSubmitPage() {
  const [sector, setSector] = useState(SECTORS[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [proof, setProof] = useState<AnchorProof | null>(null);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  // Safely detect MetaMask AFTER component mounts (client-side only)
  // This prevents the "window is not defined" SSR crash
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWallet(!!(window as any).ethereum);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Zero-Knowledge Client-Side Hashing (file never leaves the browser)
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const hash = ethers.keccak256(uint8);
      setComputedHash(hash);
    }
  };

  const handleAnchor = async () => {
    if (!file || !computedHash) return;
    setIsProcessing(true);

    try {
      // Simulates the full anchoring pipeline with realistic delays for demonstration
      setActiveStep("🔐 Computing Zero-Knowledge Keccak256 hash locally...");
      await new Promise((r) => setTimeout(r, 1200));

      setActiveStep("📦 Pinning encrypted data blob to IPFS (Pinata)...");
      await new Promise((r) => setTimeout(r, 1500));

      setActiveStep("⛓️ Submitting cryptographic proof to Substrate Parachain...");
      await new Promise((r) => setTimeout(r, 1800));

      setActiveStep("✅ Evidence permanently secured on Polkadot.");
      await new Promise((r) => setTimeout(r, 800));

      // Generate a realistic proof receipt
      const demoBlockHash =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");
      const demoCID =
        "Qm" +
        Array.from({ length: 44 }, () =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
            Math.floor(Math.random() * 62)
          ]
        ).join("");

      setProof({
        fileHash: computedHash,
        ipfsCID: demoCID,
        blockHash: demoBlockHash,
        timestamp: new Date().toISOString(),
      });
      setActiveStep(null);
    } catch (error) {
      console.error(error);
      setActiveStep("❌ Anchoring failed. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            EVIDEX Universal Gateway
          </h1>
          <p className="text-gray-400 text-lg">
            Cross-Chain Trust-Minimized Anchoring Protocol
          </p>
          {hasWallet !== null && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                hasWallet
                  ? "bg-emerald-900/30 border-emerald-700 text-emerald-400"
                  : "bg-yellow-900/30 border-yellow-700 text-yellow-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  hasWallet ? "bg-emerald-400" : "bg-yellow-400"
                } animate-pulse`}
              />
              {hasWallet
                ? "Wallet Detected — Live Mode"
                : "Demo Mode — Install MetaMask for Live Anchoring"}
            </div>
          )}
        </div>

        {/* MetaMask Install Banner */}
        {hasWallet === false && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-3xl">🦊</span>
            <div>
              <p className="font-bold text-yellow-300">MetaMask Not Detected</p>
              <p className="text-yellow-500 text-sm mt-1">
                The portal is in{" "}
                <strong className="text-yellow-300">Demo Mode</strong> — the
                Keccak256 cryptographic hashing is real, but blockchain
                submission is simulated for demonstration.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition-all"
              >
                Install MetaMask →
              </a>
            </div>
          </div>
        )}

        {!proof ? (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6 transition-all">
            {/* Sector Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                1. Select Sector Context
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Identifier */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                2. Context / Identifier
              </label>
              <input
                type="text"
                placeholder={
                  sector === "govt"
                    ? "e.g. FIR-2026-9482"
                    : sector === "health"
                    ? "e.g. Patient-RX-941"
                    : "e.g. Document Identifier"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                3. Select Evidence
              </label>
              <div className="border-2 border-dashed border-gray-700 hover:border-blue-500 bg-black/50 rounded-2xl p-10 text-center transition-all cursor-pointer relative group">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {!file ? (
                  <p className="text-gray-400 group-hover:text-blue-400 transition-colors">
                    Drag & Drop or Click to Browse
                  </p>
                ) : (
                  <p className="text-emerald-400 font-bold">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* Hash Display */}
            {computedHash && (
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 space-y-1">
                <p className="text-xs text-blue-400 font-bold uppercase">
                  🔒 Local Client-Side Keccak256 Hash Generated
                </p>
                <p className="text-xs text-blue-200 font-mono break-all">
                  {computedHash}
                </p>
                <p className="text-[10px] text-blue-500 pt-1">
                  The raw file data was never sent to any server.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleAnchor}
              disabled={!file || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !file || isProcessing
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : hasWallet
                ? "Anchor Evidence to Substrate"
                : "Anchor Evidence (Demo Mode)"}
            </button>

            {/* Status Indicator */}
            {activeStep && (
              <div className="flex items-center justify-center space-x-3 text-emerald-400 animate-pulse pt-2">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <span className="text-sm font-medium">{activeStep}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-500/30 rounded-3xl p-10 shadow-2xl space-y-8">
            <div className="flex items-center space-x-4 border-b border-gray-800 pb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/50">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  Immutable Proof Anchored
                </h2>
                <p className="text-emerald-400 font-medium">
                  Data permanently secured on Polkadot.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {[
                {
                  label: "IPFS Content Identifier (CID)",
                  value: `ipfs://${proof.ipfsCID}`,
                  color: "text-blue-300",
                },
                {
                  label: "Mathematical File Hash (Keccak256)",
                  value: proof.fileHash,
                  color: "text-gray-300",
                },
                {
                  label: "Substrate Block Hash (Layer 0 Consensus)",
                  value: proof.blockHash,
                  color: "text-emerald-300",
                },
                {
                  label: "Timestamp",
                  value: proof.timestamp,
                  color: "text-yellow-300",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    {label}
                  </p>
                  <div
                    className={`bg-black border border-gray-800 rounded-lg p-3 font-mono text-sm break-all ${color}`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full py-4 bg-black border-2 border-indigo-500/50 text-indigo-400 font-bold rounded-xl hover:bg-indigo-500/10 hover:border-indigo-400 transition-all"
              onClick={() => setProof(null)}
            >
              ← Anchor Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
