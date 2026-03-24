import Link from "next/link";

const CHAINS = [
  { name: "Polkadot", symbol: "DOT", color: "#E84142", bg: "rgba(232,65,66,0.12)", desc: "Substrate para-chain anchoring with XCM interoperability" },
  { name: "Ethereum", symbol: "ETH", color: "#60a5fa", bg: "rgba(59,130,246,0.12)", desc: "Gold standard immutable ledger for maximum legal admissibility" },
  { name: "Polygon", symbol: "MATIC", color: "#a78bfa", bg: "rgba(139,92,246,0.12)", desc: "Ultra-low cost anchoring for high-volume compliance workflows" },
];

const STATS = [
  { value: "< 3s", label: "Time to Anchor" },
  { value: "∞", label: "Proof Validity" },
  { value: "2+", label: "Active Chains" },
  { value: "0", label: "Trusted Parties" },
];

const STEPS = [
  { n: "01", title: "Upload Evidence", body: "Drop any file — contracts, images, video, audio. Your file never leaves your device unencrypted.", color: "#3b82f6" },
  { n: "02", title: "SHA-256 Fingerprint", body: "A unique 256-bit cryptographic hash is computed client-side in milliseconds.", color: "#8b5cf6" },
  { n: "03", title: "Multi-Chain Anchor", body: "The fingerprint is simultaneously anchored across Polkadot and Ethereum Sepolia.", color: "#10b981" },
  { n: "04", title: "Verify Forever", body: "Anyone can independently verify your proof on-chain — no login, no Evidex required.", color: "#f59e0b" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-32 pb-32">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center pt-20 text-center">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute top-20 -left-20 h-[300px] w-[400px] rounded-full bg-purple-600/8 blur-[80px]" />
          <div className="absolute top-10 -right-20 h-[250px] w-[350px] rounded-full bg-emerald-600/6 blur-[80px]" />
        </div>

        {/* Live badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2 text-sm font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live on Polkadot &amp; Ethereum Sepolia
        </div>

        <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-6xl lg:text-7xl" style={{ lineHeight: 1.05 }}>
          Your files,{" "}
          <span className="gradient-text">cryptographically</span>
          <br />
          proven forever.
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          Evidex anchors SHA-256 fingerprints of your evidence simultaneously across multiple blockchains.
          Tamper-proof. Independently verifiable. Zero trust required.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/signup"
            className="btn-primary px-8 py-3.5 text-base"
          >
            Start Anchoring Free →
          </Link>
          <Link
            href="/auth/signin/user"
            className="btn-secondary px-8 py-3.5 text-base"
          >
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 gap-px rounded-2xl border border-white/[0.06] bg-white/[0.06] overflow-hidden md:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-[#020509] px-8 py-5 text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="flex flex-col items-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">How it works</p>
        <h2 className="mb-14 text-3xl font-black text-white md:text-4xl">Four steps to permanent proof</h2>

        <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, body, color }) => (
            <div key={n} className="card-hover group relative overflow-hidden">
              <div
                className="absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
                style={{ background: color }}
              />
              <p className="mb-4 font-mono text-3xl font-black" style={{ color }}>
                {n}
              </p>
              <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MULTI-CHAIN ────────────────────────────────────── */}
      <section className="flex flex-col items-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-purple-400">Multi-chain anchoring</p>
        <h2 className="mb-4 text-center text-3xl font-black text-white md:text-4xl">
          One upload. Multiple chains.
        </h2>
        <p className="mb-14 max-w-xl text-center text-slate-400">
          Your evidence hash is written to all configured chains simultaneously — so even if one network
          goes offline, your proof survives on the others.
        </p>

        <div className="grid w-full gap-4 md:grid-cols-3">
          {CHAINS.map(({ name, symbol, color, bg, desc }) => (
            <div key={name} className="card-hover group relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40" style={{ background: `radial-gradient(ellipse at top left, ${color}30, transparent 60%)` }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-black" style={{ background: bg, color }}>
                  {symbol.slice(0,2)}
                </div>
                <div>
                  <p className="font-bold text-white">{name}</p>
                  <p className="text-xs text-slate-500">{symbol}</p>
                </div>
                <div className="ml-auto">
                  <span className="status-dot-green" />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-[#020509] to-purple-950/30 p-12 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-96 rounded-full bg-blue-600/15 blur-[80px]" />
        </div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-400">Get started today</p>
        <h2 className="mb-4 text-3xl font-black text-white md:text-4xl">
          Ready to anchor your truth?
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-slate-400">
          Join the evidence platform trusted by legal, financial, and media professionals.
          Free to start. No credit card required.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/auth/signup" className="btn-primary px-8 py-3.5 text-base">
            Create Free Account →
          </Link>
          <Link href="/verify" className="btn-secondary px-8 py-3.5 text-base">
            Verify a Document
          </Link>
        </div>
      </section>

    </div>
  );
}
