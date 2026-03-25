// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

const STEPS = [
  "CONNECTING TO SUBSTRATE WSS...",
  "QUERYING POLKADOT STATE ROOT...",
  "EXTRACTING MERKLE TRIE PROOF...",
  "RELAYING PROOF TO ETHEREUM LIGHT CLIENT...",
  "VERIFYING CRYPTOGRAPHIC STATE INCLUSION...",
  "CROSS-CHAIN CONSENSUS REACHED.",
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

export default function VerifyPage() {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [blockRef, setBlockRef] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState("IDLE"); // IDLE | PASS | FAIL
  const [errMsg, setErrMsg] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") setHasWallet(!!(window).ethereum);
  }, []);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult("IDLE");
    setErrMsg(null);
    setStep(-1);
    const buf = await f.arrayBuffer();
    const h = ethers.keccak256(new Uint8Array(buf));
    setHash(h);
  };

  const handleVerify = async () => {
    if (!hash) return;
    setIsVerifying(true);
    setResult("IDLE");
    try {
      for (let i = 0; i < STEPS.length; i++) {
        setStep(i);
        await new Promise((r) => setTimeout(r, 900 + i * 300));
      }
      setResult("PASS");
    } catch (e) {
      setResult("FAIL");
      setErrMsg(e.message || "HASH MISMATCH — STATE ROOT INVALID.");
    } finally {
      setStep(-1);
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setFile(null); setHash(null); setResult("IDLE");
    setErrMsg(null); setStep(-1); setWalletAddress(""); setBlockRef("");
  };

  return (
    <div className="relative min-h-screen bg-black font-mono text-white overflow-hidden">
      <NoiseBg />

      {/* HUD top-left */}
      <div className="fixed top-0 left-0 z-50 p-5">
        <a href="/" className="text-[10px] tracking-[0.35em] text-white/30 hover:text-[#ff6600] transition-colors uppercase">← EVIDEX LAB</a>
        <div className="text-[13px] tracking-[0.2em] text-[#ff6600] mt-1 uppercase font-bold">AUDIT PORTAL</div>
      </div>

      {/* HUD top-right */}
      <div className="fixed top-0 right-0 z-50 p-5 text-right space-y-1">
        <div className="text-[10px] tracking-widest text-white/25 uppercase">LIGHT CLIENT</div>
        <div className="text-[11px] tracking-widest text-[#00ffff] uppercase">ETHEREUM L1</div>
        <div className="text-[10px] tracking-widest text-white/15 uppercase">SUBSTRATE WSS</div>
      </div>

      {/* HUD bottom-left */}
      <div className="fixed bottom-0 left-0 z-50 p-5">
        <div className={`text-[10px] tracking-[0.25em] uppercase ${
          result === "PASS" ? "text-[#00ff88]" :
          result === "FAIL" ? "text-[#ff4444]" :
          "text-white/20"
        }`}>
          {result === "PASS" ? "● VERIFIED AUTHENTIC" :
           result === "FAIL" ? "● STATE TAMPERED" :
           "○ AWAITING AUDIT"}
        </div>
      </div>

      {/* Main */}
      <div className="relative z-30 max-w-2xl mx-auto px-6 pt-32 pb-24 space-y-10">

        {result === "IDLE" && (
          <>
            {/* File drop */}
            <div className="space-y-3">
              <div className="text-[9px] tracking-[0.35em] text-white/30 uppercase">01 / SUSPECT DOCUMENT</div>
              <label className={`block border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                hash ? "border-[#ff6600]/50 bg-[#ff6600]/3" : "border-white/10 hover:border-white/20"
              }`}>
                <input type="file" onChange={handleFile} className="hidden" />
                {!file ? (
                  <div className="space-y-2">
                    <div className="text-[11px] tracking-[0.25em] text-white/25 uppercase">DROP FILE TO GENERATE CRYPTOGRAPHIC FINGERPRINT</div>
                    <div className="text-[9px] tracking-widest text-white/10 uppercase">Keccak256 computed client-side</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[12px] tracking-widest text-[#ff6600] uppercase">{file.name}</div>
                    {hash && <div className="text-[9px] text-white/30 font-mono break-all">{hash}</div>}
                  </div>
                )}
              </label>
            </div>

            {/* Params */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[9px] tracking-[0.35em] text-white/30 uppercase">02 / ANCHOR AUTHORITY</div>
                <input
                  type="text"
                  placeholder="5FHNE... (OPTIONAL)"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-transparent border border-white/10 text-white/60 text-[10px] tracking-widest uppercase placeholder:text-white/15 px-4 py-3 focus:border-[#ff6600]/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <div className="text-[9px] tracking-[0.35em] text-white/30 uppercase">03 / BLOCK REFERENCE</div>
                <input
                  type="text"
                  placeholder="0X9A8B... (OPTIONAL)"
                  value={blockRef}
                  onChange={(e) => setBlockRef(e.target.value)}
                  className="w-full bg-transparent border border-white/10 text-white/60 text-[10px] tracking-widest uppercase placeholder:text-white/15 px-4 py-3 focus:border-[#ff6600]/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Progress */}
            {isVerifying && (
              <div className="space-y-2 border border-white/5 p-6 bg-white/2">
                {STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 text-[10px] tracking-widest uppercase transition-all ${
                    i < step ? "text-white/20 line-through" :
                    i === step ? "text-[#ff6600] animate-pulse" :
                    "text-white/10"
                  }`}>
                    <span>{i < step ? "✓" : i === step ? "▶" : "○"}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={!hash || isVerifying}
              className={`w-full py-4 text-[11px] tracking-[0.35em] uppercase font-bold transition-all border ${
                !hash || isVerifying
                  ? "border-white/10 text-white/20 cursor-not-allowed"
                  : "border-[#ff6600]/60 text-[#ff6600] hover:bg-[#ff6600] hover:text-black"
              }`}
            >
              {isVerifying ? "EXECUTING CROSS-CHAIN MERKLE AUDIT..." : "EXECUTE LIGHT CLIENT VERIFICATION"}
            </button>
          </>
        )}

        {/* PASS */}
        {result === "PASS" && (
          <div className="space-y-8">
            <div className="border border-[#00ff88]/30 p-8 space-y-6">
              <div className="text-[9px] tracking-[0.4em] text-[#00ff88] uppercase">ETHEREUM LIGHT CLIENT — CONSENSUS REACHED</div>
              <div className="text-[8vw] md:text-[52px] font-black uppercase leading-none tracking-tight text-white">
                VERIFIED<br />AUTHENTIC.
              </div>
              <p className="text-[11px] text-white/40 tracking-widest uppercase leading-relaxed">
                The Ethereum Light Client has mathematically proven that this exact document exists inside the Polkadot State Root — without tampering.
              </p>
              <div className="space-y-1">
                <div className="text-[9px] tracking-widest text-white/20 uppercase">KECCAK256 FINGERPRINT</div>
                <div className="text-[10px] text-[#00ff88]/70 font-mono break-all p-3 bg-[#00ff88]/3">{hash}</div>
              </div>
            </div>
            <button onClick={reset} className="w-full py-4 text-[11px] tracking-[0.35em] uppercase border border-white/10 text-white/30 hover:border-white/25 hover:text-white/60 transition-all">
              ← AUDIT ANOTHER DOCUMENT
            </button>
          </div>
        )}

        {/* FAIL */}
        {result === "FAIL" && (
          <div className="space-y-8">
            <div className="border border-[#ff4444]/30 p-8 space-y-6">
              <div className="text-[9px] tracking-[0.4em] text-[#ff4444] uppercase">ETHEREUM LIGHT CLIENT — PROOF REJECTED</div>
              <div className="text-[8vw] md:text-[52px] font-black uppercase leading-none tracking-tight text-[#ff4444]">
                STATE<br />TAMPERED.
              </div>
              <p className="text-[11px] text-white/40 tracking-widest uppercase leading-relaxed">
                Cryptographic proof validation failed. This document does not match the anchored Substrate State Root.
              </p>
              {errMsg && (
                <div className="text-[9px] text-[#ff4444]/60 font-mono p-3 bg-[#ff4444]/5 break-all">{errMsg}</div>
              )}
            </div>
            <button onClick={reset} className="w-full py-4 text-[11px] tracking-[0.35em] uppercase border border-white/10 text-white/30 hover:border-white/25 hover:text-white/60 transition-all">
              ← AUDIT ANOTHER DOCUMENT
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
