import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* 🚀 1. HERO SECTION */}
      <section className="relative flex flex-col items-center pt-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          99.9% Uptime • Enterprise Audit Ready
        </p>
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-7xl">
          Prove your files existed — <span className="text-blue-500">forever.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
          Anchor legal, financial, and media evidence cryptographically across 80+ blockchains in seconds. 
          Zero trust required. Mathematically unforgeable.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/auth/signup" className="rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500">
            Start Anchoring Free
          </Link>
          <Link href="/auth/signin/user" className="rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-slate-200 backdrop-blur transition hover:bg-slate-700">
            Sign In
          </Link>
        </div>
      </section>

      {/* ⚖️ 2. CORE BENEFITS */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur transition hover:border-blue-500/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-2xl text-blue-400">🏛️</div>
          <h3 className="text-xl font-bold text-white">Court-Admissible Proof</h3>
          <p className="mt-2 text-slate-400 leading-relaxed">Cryptographic timestamping mapping hashes directly to immutable ledgers, satisfying extreme legal discovery standards.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur transition hover:border-emerald-500/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-2xl text-emerald-400">✅</div>
          <h3 className="text-xl font-bold text-white">Audit-Ready Verification</h3>
          <p className="mt-2 text-slate-400 leading-relaxed">Instantly generate deterministic proofs for any auditor, proving continuous data integrity with zero knowledge leaks.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur transition hover:border-purple-500/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-2xl text-purple-400">🛡️</div>
          <h3 className="text-xl font-bold text-white">Tamper-Proof Storage</h3>
          <p className="mt-2 text-slate-400 leading-relaxed">Original payloads are fully decentralized while mathematical metadata gets permanently etched into layer-1 consensus.</p>
        </div>
      </section>

      {/* 🎯 3. HOW IT WORKS */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-10">
        <h2 className="mb-10 text-center text-3xl font-bold text-white">How it works</h2>
        <div className="grid gap-8 md:grid-cols-4 relative">
          {/* Connecting line for desktop */}
          <div className="absolute top-8 left-[12%] right-[12%] hidden h-0.5 bg-slate-800 md:block"></div>
          
          <div className="text-center relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-2xl font-bold text-slate-300 shadow-xl">1</div>
            <h4 className="font-semibold text-white">Upload File</h4>
            <p className="mt-2 text-sm text-slate-400">Drop your sensitive evidence into our secure local client.</p>
          </div>
          <div className="text-center relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-2xl font-bold text-slate-300 shadow-xl">2</div>
            <h4 className="font-semibold text-white">Hash Generation</h4>
            <p className="mt-2 text-sm text-slate-400">Your browser instantly generates a unique SHA-256 fingerprint.</p>
          </div>
          <div className="text-center relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-900 text-2xl font-bold text-blue-400 shadow-xl shadow-blue-900/20">3</div>
            <h4 className="font-semibold text-white">Anchor on Chain</h4>
            <p className="mt-2 text-sm text-slate-400">The fingerprint is etched permanently into an immutable ledger.</p>
          </div>
          <div className="text-center relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-900 text-2xl font-bold text-emerald-400 shadow-xl shadow-emerald-900/20">4</div>
            <h4 className="font-semibold text-white">Verify Anytime</h4>
            <p className="mt-2 text-sm text-slate-400">Download a cryptographic certificate demonstrating unforgeable authenticity.</p>
          </div>
        </div>
      </section>

      {/* 🧠 4. MULTI-CHAIN ADVANTAGE */}
      <section className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">Why Multi-Chain?</h2>
        <p className="mb-10 max-w-2xl text-lg text-slate-400">
          EVIDEX doesn&apos;t lock your evidence into a single database. We utilize a dynamic AI routing engine 
          to leverage exactly what you need, exactly when you need it.
        </p>
        <div className="grid w-full gap-4 md:grid-cols-3 text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 font-bold text-emerald-400">
              <span className="text-xl">💸</span> Polygon
            </div>
            <p className="text-sm text-slate-300">Ultra-cheap, high-throughput anchoring for massive datasets and daily compliance audit logging.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 font-bold text-orange-400">
              <span className="text-xl">⚡</span> Arbitrum
            </div>
            <p className="text-sm text-slate-300">Lightning-fast block finality. Perfect for real-time journalistic evidence and instantaneous proof generation.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 font-bold text-blue-400">
              <span className="text-xl">🌐</span> Ethereum
            </div>
            <p className="text-sm text-slate-300">The gold standard of cryptographic security. The most immutable financial and legal ledgers in human history.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
