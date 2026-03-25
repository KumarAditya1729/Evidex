"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function EvidexLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-black" />; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg">E</div>
          <span className="text-xl font-bold tracking-widest uppercase">EVIDEX</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400">
          <Link href="#architecture" className="hover:text-white transition-colors">Architecture</Link>
          <a href="https://github.com/KumarAditya1729/Evidex" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
        <div className="flex items-center space-x-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-sm font-mono text-emerald-500">Substrate WSS Online</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 pb-24 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Now Live on Cross-Chain Testnet</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
          The Universal <br /> Trust Layer.
        </h1>
        
        <p className="max-w-3xl text-xl md:text-2xl text-gray-400 mb-12 font-light leading-relaxed">
          Evidex mathematically anchors real-world evidence across 
          <span className="text-blue-400 font-medium"> Polkadot </span> and 
          <span className="text-indigo-400 font-medium"> Ethereum </span> 
          without blind trust. Build invincible systems for Government, Finance, and Healthcare.
        </p>

        {/* Portal Entry Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
          
          <Link href="/evidence/submit" className="w-full sm:w-auto group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative flex items-center space-x-2">
               <span>Anchor Data (Submit)</span>
               <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </span>
          </Link>

          <Link href="/evidence/verify" className="w-full sm:w-auto group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-gray-900 border border-gray-700 px-8 font-medium text-white transition-all duration-300 hover:scale-105 hover:border-gray-500 hover:bg-gray-800">
             <span className="relative flex items-center space-x-2">
               <span>Audit Data (Verify)</span>
               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </span>
          </Link>
          
        </div>

        <div className="mt-8">
          <Link href="/explorer" className="text-gray-500 hover:text-emerald-400 text-sm font-medium transition-colors border-b border-transparent hover:border-emerald-400 pb-1">
             → Or View the Live Substrate Explorer Feed
          </Link>
        </div>
      </main>

      {/* Architecture Overview Section */}
      <section id="architecture" className="relative z-10 bg-black border-t border-gray-800 py-24">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold mb-4">How Evidex Achieves Zero-Trust</h2>
               <p className="text-gray-400 max-w-2xl mx-auto">We ripped the cryptography out of the backend and put it in your hands. A 3-pillar protocol engineering masterclass.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               
               {/* Pillar 1 */}
               <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:border-blue-500/50 transition-colors">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 border border-blue-500/20">🔒</div>
                  <h3 className="text-xl font-bold mb-3 text-white">Client-Side Proofs</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     When you anchor data, the `@evidex/sdk` computes the exact Keccak256 hash locally on your device's GPU. The raw PDF or Image is never sent to a vulnerable backend API.
                  </p>
               </div>

               {/* Pillar 2 */}
               <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-colors">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 border border-emerald-500/20">⛓️</div>
                  <h3 className="text-xl font-bold mb-3 text-white">Substrate Layer 0</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     Hashes are anchored to a custom Rust-built Polkadot Parachain. Native XCMP (Cross-Consensus Messaging) algorithms route your evidence immutably across the network.
                  </p>
               </div>

               {/* Pillar 3 */}
               <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:border-indigo-500/50 transition-colors">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 border border-indigo-500/20">⚖️</div>
                  <h3 className="text-xl font-bold mb-3 text-white">Ethereum Light Client</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     Auditors don't have to trust Polkadot. Evidex natively extracts the Substrate Trie proof and mathematically verifies it via Smart Contracts on the EVM in real-time.
                  </p>
               </div>

            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 text-center text-gray-600 text-sm relative z-10 bg-black">
         <p>EVIDEX Protocol Architecture. Built for Trust-Minimized Data Anchoring.</p>
         <p className="mt-2 text-gray-500">© 2026 EVIDEX Foundation</p>
      </footer>
    </div>
  );
}
