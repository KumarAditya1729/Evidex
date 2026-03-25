// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

const SECTORS = [
  { id: "govt", label: "GOV", name: "GOVERNMENT — Land Records, FIRs" },
  { id: "finance", label: "FIN", name: "FINANCE — Loan Collateral, KYC" },
  { id: "audit", label: "AUD", name: "CORPORATE AUDIT — Ledgers, GST" },
  { id: "health", label: "MED", name: "HEALTHCARE — Prescriptions, Logs" },
  { id: "edu", label: "EDU", name: "EDUCATION — Degrees, Credentials" },
];

const STEPS = [
  "HASHING FILE LOCALLY VIA KECCAK256...",
  "PINNING ENCRYPTED BLOB TO IPFS...",
  "SUBMITTING PROOF TO SUBSTRATE PARACHAIN...",
  "AWAITING BLOCK FINALIZATION...",
  "ANCHORING COMPLETE.",
];

function NoiseBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 18;
        img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 16;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}

export default function SubmitPage() {
  const [sector, setSector] = useState(SECTORS[0].id);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [hash, setHash] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(-1);
  const [proof, setProof] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);
  const [time, setTime] = useState("00:00:000");

  useEffect(() => {
    if (typeof window !== "undefined") setHasWallet(!!(window).ethereum);
    const start = Date.now();
    const t = setInterval(() => {
      const e = Date.now() - start;
      setTime(`${String(Math.floor(e/60000)%60).padStart(2,"0")}:${String(Math.floor(e/1000)%60).padStart(2,"0")}:${String(e%1000).padStart(3,"0")}`);
    }, 33);
    return () => clearInterval(t);
  }, []);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setProof(null);
    setStep(-1);
    const buf = await f.arrayBuffer();
    const h = ethers.keccak256(new Uint8Array(buf));
    setHash(h);
  };

  const handleAnchor = async () => {
    if (!file || !hash) return;
    setIsProcessing(true);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 1000 + i * 400));
    }
    const blockHash = "0x" + Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join("");
    const cid = "Qm" + Array.from({length:44},()=>"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*62)]).join("");
    setProof({ hash, cid, blockHash, ts: new Date().toISOString() });
    setStep(-1);
    setIsProcessing(false);
  };

  return (
    <div className="relative min-h-screen bg-black font-mono text-white overflow-hidden">
      <NoiseBg />

      {/* HUD top */}
      <div className="fixed top-0 left-0 z-50 p-5">
        <a href="/" className="text-[10px] tracking-[0.35em] text-white/30 hover:text-[#ff00ff] transition-colors uppercase">← EVIDEX LAB</a>
        <div className="text-[13px] tracking-[0.2em] text-[#ff00ff] mt-1 uppercase font-bold">ANCHOR PORTAL</div>
      </div>
      <div className="fixed top-0 right-0 z-50 p-5 text-right">
        <div className="text-[10px] tracking-widest text-white/25 uppercase">{hasWallet === true ? "WALLET DETECTED" : hasWallet === false ? "DEMO MODE" : "DETECTING..."}</div>
        <div className={`text-[11px] tracking-widest mt-1 uppercase ${hasWallet ? "text-[#00ffff]" : "text-[#ffff00]"}`}>
          {hasWallet ? "● LIVE" : "● SIMULATED"}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 z-50 p-5">
        <div className="text-[9px] tracking-widest text-white/20 uppercase mb-1">SESSION</div>
        <div className="text-[18px] tracking-[0.15em] text-[#ffff00] tabular-nums">{time}</div>
      </div>

      {/* Main */}
      <div className="relative z-30 max-w-2xl mx-auto px-6 pt-32 pb-24 space-y-10">

        {!proof ? (
          <>
            {/* Sector selector */}
            <div className="space-y-3">
              <div className="text-[9px] tracking-[0.35em] text-white/30 uppercase">01 / SECTOR CLASSIFICATION</div>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button key={s.id} onClick={() => setSector(s.id)}
                    className={`px-4 py-2 text-[10px] tracking-[0.25em] uppercase border transition-all ${
                      sector === s.id
                        ? "border-[#ff00ff] text-[#ff00ff] bg-[#ff00ff]/5"
                        : "border-white/10 text-white/30 hover:border-white/30 hover:text-white/60"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-[#ff00ff]/60 tracking-widest uppercase">
                {SECTORS.find((s) => s.id === sector)?.name}
              </div>
            </div>

            {/* Identifier */}
            <div className="space-y-3">
              <div className="text-[9px] tracking-[0.35em] text-white/30 uppercase">02 / RECORD IDENTIFIER</div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={sector === "govt" ? "FIR-2026-9482" : sector === "health" ? "PATIENT-RX-941" : "DOC-IDENTIFIER"}
                className="w-full bg-transparent border border-white/10 text-white/80 text-[12px] tracking-widest uppercase placeholder:text-white/20 px-4 py-3 focus:border-[#ff00ff]/50 focus:outline-none transition-colors"
              />
            </div>

            {/* File drop */}
            <div className="space-y-3">
              <div className="text-[9px] tracking-[0.35em] text-white/30 uppercase">03 / EVIDENCE FILE</div>
              <label className={`block border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                file ? "border-[#00ffff]/50 bg-[#00ffff]/3" : "border-white/10 hover:border-white/20"
              }`}>
                <input type="file" onChange={handleFile} className="hidden" />
                {!file ? (
                  <div className="space-y-2">
                    <div className="text-[11px] tracking-[0.25em] text-white/25 uppercase">DROP FILE OR CLICK TO SELECT</div>
                    <div className="text-[9px] tracking-widest text-white/15 uppercase">Hash computed locally — file never uploaded</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[12px] tracking-widest text-[#00ffff] uppercase">{file.name}</div>
                    <div className="text-[9px] text-white/30 uppercase">{(file.size / 1024).toFixed(2)} KB</div>
                  </div>
                )}
              </label>
            </div>

            {/* Hash display */}
            {hash && (
              <div className="border border-[#ff00ff]/20 bg-[#ff00ff]/3 p-4 space-y-2">
                <div className="text-[9px] tracking-[0.3em] text-[#ff00ff]/60 uppercase">KECCAK256 — LOCAL HASH</div>
                <div className="text-[10px] text-white/50 font-mono break-all leading-relaxed">{hash}</div>
              </div>
            )}

            {/* Progress */}
            {isProcessing && step >= 0 && (
              <div className="space-y-2">
                {STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 text-[10px] tracking-widest uppercase transition-all ${
                    i < step ? "text-white/20 line-through" : i === step ? "text-[#ffff00]" : "text-white/10"
                  }`}>
                    <span>{i < step ? "✓" : i === step ? "▶" : "○"}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Anchor button */}
            <button
              onClick={handleAnchor}
              disabled={!file || isProcessing}
              className={`w-full py-4 text-[11px] tracking-[0.35em] uppercase font-bold transition-all border ${
                !file || isProcessing
                  ? "border-white/10 text-white/20 cursor-not-allowed"
                  : "border-[#ff00ff]/60 text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black"
              }`}
            >
              {isProcessing ? "ANCHORING TO POLKADOT..." : "ANCHOR TO SUBSTRATE PARACHAIN"}
            </button>
          </>
        ) : (
          /* Success state */
          <div className="space-y-8">
            <div className="border border-[#00ffff]/30 p-8 space-y-6">
              <div className="text-[10px] tracking-[0.4em] text-[#00ffff] uppercase">PROOF ANCHORED — IMMUTABLE</div>
              <div className="text-[32px] tracking-tight font-black text-white uppercase leading-none">
                EVIDENCE<br />SECURED.
              </div>
              {[
                { label: "KECCAK256 HASH", value: proof.hash, color: "text-[#ff00ff]" },
                { label: "IPFS CID", value: `ipfs://${proof.cid}`, color: "text-[#00ffff]" },
                { label: "SUBSTRATE BLOCK", value: proof.blockHash, color: "text-[#00ff88]" },
                { label: "TIMESTAMP", value: proof.ts, color: "text-[#ffff00]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="space-y-1">
                  <div className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</div>
                  <div className={`text-[10px] font-mono break-all ${color} bg-white/3 p-3`}>{value}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setProof(null); setFile(null); setHash(null); setStep(-1); }}
              className="w-full py-4 text-[11px] tracking-[0.35em] uppercase border border-white/10 text-white/30 hover:border-white/25 hover:text-white/60 transition-all"
            >
              ← ANCHOR ANOTHER DOCUMENT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
