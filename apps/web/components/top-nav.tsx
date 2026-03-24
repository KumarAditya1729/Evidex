"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletAuthButton } from "@/components/wallet-auth-button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/upload", label: "Upload", icon: "↑" },
  { href: "/verify", label: "Verify", icon: "✓" },
  { href: "/explorer", label: "Explorer", icon: "⛓" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50">
      {/* Glassmorphism bar */}
      <div className="border-b border-white/[0.06] bg-[#020509]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-bold transition-all group-hover:bg-blue-600/30 group-hover:border-blue-500/50">
              E
            </div>
            <span className="text-sm font-bold tracking-wide text-white">
              Evidex
            </span>
            <span className="hidden text-xs text-slate-500 md:block">
              / Trust Platform
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs opacity-60">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden text-xs text-slate-500 hover:text-slate-300 transition lg:block"
            >
              Admin ↗
            </Link>
            <WalletAuthButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
