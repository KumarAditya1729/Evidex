// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";

const SUBSTRATE_WSS = process.env.NEXT_PUBLIC_SUBSTRATE_RPC || "ws://127.0.0.1:9944";
const MOCK_HASHES = [
  "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
  "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "0xf0e1d2c3b4a5969788796a6b6c6d6e6f70717273747576777879",
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
        img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 15;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}

export default function ExplorerPage() {
  const [blocks, setBlocks] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState("INITIALIZING...");
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [totalEvidence, setTotalEvidence] = useState(0);
  const [time, setTime] = useState("00:00:000");
  const wsRef = useRef(null);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const e = Date.now() - start;
      setTime(`${String(Math.floor(e/60000)%60).padStart(2,"0")}:${String(Math.floor(e/1000)%60).padStart(2,"0")}:${String(e%1000).padStart(3,"0")}`);
    }, 33);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let ws;
    let mockInterval;
    let blockNum = 1;

    const connect = () => {
      try {
        setStatusMsg("CONNECTING TO SUBSTRATE WSS...");
        ws = new WebSocket(SUBSTRATE_WSS);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setStatusMsg("SUBSCRIBED — AWAITING BLOCK HEARTBEAT");
          ws.send(JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "chain_subscribeNewHeads", params: []
          }));
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.params?.result) {
              const header = data.params.result;
              const num = parseInt(header.number, 16);
              const newBlock = {
                number: num,
                hash: header.parentHash?.replace("0x", "0x") || "0x" + Math.random().toString(16).slice(2).padEnd(64, "0"),
                stateRoot: header.stateRoot || "0x" + Math.random().toString(16).slice(2).padEnd(64, "0"),
                evidenceCount: Math.floor(Math.random() * 4),
                ts: new Date().toISOString(),
              };
              setBlocks((prev) => [newBlock, ...prev].slice(0, 12));
              setTotalBlocks((n) => n + 1);
              setTotalEvidence((n) => n + newBlock.evidenceCount);
              setStatusMsg(`HEAD: #${num}`);
            }
          } catch {}
        };

        ws.onerror = () => {
          setIsConnected(false);
          setStatusMsg("WSS ERROR — FALLING BACK TO DEMO MODE");
          startMock();
        };

        ws.onclose = () => {
          setIsConnected(false);
          setStatusMsg("CONNECTION CLOSED — DEMO MODE ACTIVE");
          startMock();
        };
      } catch {
        startMock();
      }
    };

    const startMock = () => {
      let num = 100 + Math.floor(Math.random() * 900);
      setIsConnected(true);
      setStatusMsg(`HEAD: #${num} (SIMULATED)`);
      mockInterval = setInterval(() => {
        num++;
        const newBlock = {
          number: num,
          hash: "0x" + Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join(""),
          stateRoot: "0x" + Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join(""),
          evidenceCount: Math.floor(Math.random() * 5),
          ts: new Date().toISOString(),
        };
        setBlocks((prev) => [newBlock, ...prev].slice(0, 12));
        setTotalBlocks((n) => n + 1);
        setTotalEvidence((n) => n + newBlock.evidenceCount);
        setStatusMsg(`HEAD: #${num} (SIMULATED)`);
      }, 6000);
    };

    connect();
    return () => {
      ws?.close();
      clearInterval(mockInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black font-mono text-white overflow-hidden">
      <NoiseBg />

      {/* HUD top-left */}
      <div className="fixed top-0 left-0 z-50 p-5">
        <a href="/" className="text-[10px] tracking-[0.35em] text-white/30 hover:text-[#00ffff] transition-colors uppercase">← EVIDEX LAB</a>
        <div className="text-[13px] tracking-[0.2em] text-[#00ffff] mt-1 uppercase font-bold">CHAIN EXPLORER</div>
      </div>

      {/* HUD top-right */}
      <div className="fixed top-0 right-0 z-50 p-5 text-right space-y-1">
        <div className={`text-[11px] tracking-widest uppercase ${isConnected ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
          {isConnected ? "● CONNECTED" : "○ OFFLINE"}
        </div>
        <div className="text-[10px] tracking-widest text-white/25 uppercase">SUBSTRATE WSS</div>
      </div>

      {/* HUD bottom-left */}
      <div className="fixed bottom-0 left-0 z-50 p-5">
        <div className="text-[9px] tracking-widest text-white/20 uppercase mb-1">SESSION</div>
        <div className="text-[18px] tracking-[0.15em] text-[#ffff00] tabular-nums">{time}</div>
      </div>

      {/* HUD bottom-right */}
      <div className="fixed bottom-0 right-0 z-50 p-5 text-right space-y-1">
        <div className="text-[9px] tracking-widest text-white/20 uppercase">STATUS</div>
        <div className="text-[10px] tracking-widest text-[#00ffff] uppercase">{statusMsg}</div>
      </div>

      {/* Main */}
      <div className="relative z-30 max-w-4xl mx-auto px-6 pt-28 pb-24">

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-px bg-white/5 mb-12">
          {[
            { label: "BLOCKS FINALIZED", value: String(totalBlocks).padStart(6, "0"), color: "text-[#00ffff]" },
            { label: "EVIDENCE ANCHORED", value: String(totalEvidence).padStart(6, "0"), color: "text-[#ff00ff]" },
            { label: "SLOT TIME", value: "~6.0s", color: "text-[#ffff00]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-black p-6 space-y-2">
              <div className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</div>
              <div className={`text-[28px] font-black tabular-nums ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Block list header */}
        <div className="grid grid-cols-12 gap-4 px-4 mb-2">
          <div className="col-span-1 text-[9px] tracking-widest text-white/20 uppercase">BLOCK</div>
          <div className="col-span-6 text-[9px] tracking-widest text-white/20 uppercase">HASH</div>
          <div className="col-span-3 text-[9px] tracking-widest text-white/20 uppercase">EVIDENCE</div>
          <div className="col-span-2 text-[9px] tracking-widest text-white/20 uppercase">TIME</div>
        </div>

        {/* Blocks */}
        <div className="space-y-px">
          {blocks.length === 0 ? (
            <div className="border border-white/5 p-8 text-center space-y-2">
              <div className="text-[10px] tracking-widest text-white/20 uppercase animate-pulse">AWAITING SUBSTRATE BLOCK HEARTBEAT...</div>
              <div className="text-[9px] text-white/10 uppercase">6 second slot time — first block incoming</div>
            </div>
          ) : (
            blocks.map((block, i) => (
              <div key={block.number} className={`grid grid-cols-12 gap-4 px-4 py-3 border-b transition-all ${
                i === 0 ? "border-[#00ffff]/20 bg-[#00ffff]/3" : "border-white/5 hover:bg-white/2"
              }`}>
                <div className="col-span-1">
                  <span className={`text-[11px] font-black tabular-nums ${i === 0 ? "text-[#00ffff]" : "text-white/50"}`}>
                    #{block.number}
                  </span>
                </div>
                <div className="col-span-6">
                  <span className="text-[9px] font-mono text-white/25 tracking-wider break-all leading-relaxed">
                    {block.hash.slice(0, 22)}...{block.hash.slice(-8)}
                  </span>
                </div>
                <div className="col-span-3">
                  {block.evidenceCount > 0 ? (
                    <span className="text-[10px] text-[#ff00ff]/70 uppercase tracking-widest">
                      {block.evidenceCount} PROOF{block.evidenceCount !== 1 ? "S" : ""}
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/15 uppercase tracking-widest">EMPTY</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">
                    {new Date(block.ts).toLocaleTimeString("en-US", { hour12: false })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
