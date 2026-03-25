"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const CHAINS = ["POLKADOT", "ETHEREUM", "IPFS", "SUBSTRATE", "XCM", "EVM"];
const STATS = [
  { label: "CONSENSUS", value: "FINALIZED" },
  { label: "PROTOCOL", value: "v2.4.1" },
  { label: "NETWORK", value: "TESTNET" },
];

function useTypingEffect(words: string[], speed = 80, pause = 2000) {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    } else {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    }

    setDisplayed(word.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return displayed;
}

function NoiseBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 20;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 18;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    const interval = setInterval(draw, 120);
    window.addEventListener("resize", draw);
    return () => { clearInterval(interval); window.removeEventListener("resize", draw); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];
    const COLORS = ["#ff00ff", "#00ffff", "#ffff00", "#ff6600", "#00ff88"];
    
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: Math.random() * 200,
        maxLife: 150 + Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 0;
        }
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
        // glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "15";
        ctx.fill();
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function LandingPage() {
  const [time, setTime] = useState("00:00:000");
  const [blockCount, setBlockCount] = useState(0);
  const typed = useTypingEffect(["IMMUTABLE", "TRUSTLESS", "CROSS-CHAIN", "TAMPER-PROOF", "DECENTRALIZED"]);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const ms = elapsed % 1000;
      const s = Math.floor(elapsed / 1000) % 60;
      const m = Math.floor(elapsed / 60000) % 60;
      setTime(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(ms).padStart(3, "0")}`);
    }, 33);
    const b = setInterval(() => setBlockCount((n) => n + 1), 6000);
    return () => { clearInterval(t); clearInterval(b); };
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-mono text-white select-none">
      <ParticleField />
      <NoiseBg />

      {/* HUD — Top Left */}
      <div className="fixed top-0 left-0 z-50 p-6 space-y-1">
        <div className="text-[11px] tracking-[0.3em] text-white/40 uppercase">EVIDEX LAB</div>
        <div className="text-[13px] tracking-[0.2em] text-[#ff00ff] uppercase font-bold">Trust Protocol</div>
        <div className="text-[10px] tracking-widest text-white/25 mt-2">MULTI-CHAIN ANCHORING SYSTEM</div>
      </div>

      {/* HUD — Top Right */}
      <div className="fixed top-0 right-0 z-50 p-6 text-right space-y-1">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center justify-end gap-3">
            <span className="text-[10px] tracking-widest text-white/30 uppercase">{s.label}</span>
            <span className="text-[11px] tracking-widest text-[#00ffff] uppercase">{s.value}</span>
          </div>
        ))}
      </div>

      {/* HUD — Bottom Left Timer */}
      <div className="fixed bottom-0 left-0 z-50 p-6">
        <div className="text-[11px] tracking-[0.25em] text-white/30 uppercase mb-1">SESSION</div>
        <div className="text-[22px] tracking-[0.15em] text-[#ffff00] tabular-nums">{time}</div>
      </div>

      {/* HUD — Bottom Right */}
      <div className="fixed bottom-0 right-0 z-50 p-6 text-right space-y-1">
        <div className="text-[10px] tracking-widest text-white/30 uppercase">BLOCKS FINALIZED</div>
        <div className="text-[18px] tracking-widest text-[#ff00ff] tabular-nums">{String(blockCount).padStart(6, "0")}</div>
        <div className="text-[9px] tracking-widest text-white/20 uppercase">≈ 6s SLOT TIME</div>
      </div>

      {/* Horizontal scanline */}
      <div className="fixed inset-x-0 z-20 pointer-events-none" style={{ top: "50%" }}>
        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Main Center Content */}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen px-8 text-center">

        {/* Live chain ticker */}
        <div className="flex items-center gap-2 mb-12 flex-wrap justify-center">
          {CHAINS.map((c, i) => (
            <span key={c} className="text-[10px] tracking-[0.3em] text-white/25 uppercase">
              {c}{i < CHAINS.length - 1 && <span className="mx-2 text-[#ff00ff]/40">·</span>}
            </span>
          ))}
        </div>

        {/* Main headline */}
        <div className="space-y-2 mb-6">
          <div className="text-[11px] tracking-[0.4em] text-white/30 uppercase mb-8">
            THE UNIVERSAL TRUST LAYER
          </div>
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-black leading-none tracking-tight uppercase">
            <span className="block text-white">EVIDENCE</span>
            <span className="block" style={{
              background: "linear-gradient(135deg, #ff00ff, #00ffff, #ffff00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {typed || "\u00a0"}<span className="animate-pulse text-white/50">_</span>
            </span>
          </h1>
        </div>

        <p className="max-w-xl text-[13px] leading-relaxed text-white/35 tracking-wide mb-16 uppercase">
          Cryptographic proofs anchored across{" "}
          <span className="text-[#ff00ff]/80">Polkadot</span> and{" "}
          <span className="text-[#00ffff]/80">Ethereum</span>{" "}
          without blind trust. Built for Government, Finance, and Healthcare.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/evidence/submit"
            className="group relative px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold overflow-hidden border border-[#ff00ff]/50 text-[#ff00ff] transition-all duration-300 hover:border-[#ff00ff] hover:text-black"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ff00ff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            ANCHOR DATA
          </Link>
          <Link href="/evidence/verify"
            className="px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold border border-white/15 text-white/50 transition-all hover:border-white/40 hover:text-white/90"
          >
            VERIFY PROOF
          </Link>
          <Link href="/explorer"
            className="px-10 py-4 text-[11px] tracking-[0.3em] uppercase text-white/25 hover:text-[#00ffff]/80 transition-all"
          >
            → LIVE EXPLORER
          </Link>
        </div>

        {/* Divider */}
        <div className="mt-24 w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}
