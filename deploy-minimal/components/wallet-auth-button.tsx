"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SessionPayload {
  name?: string;
  walletAddress: string;
  role: "USER" | "ADMIN";
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletAuthButton() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          setSession(null);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setSession(data.user);
        setIsLoading(false);
      })
      .catch(() => {
        setSession(null);
        setIsLoading(false);
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <div className="rounded-full border border-cloud/20 px-4 py-2 text-sm text-cloud/60">Checking session...</div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/signin/user" className="btn-secondary rounded-full">
          User Login
        </Link>
        <Link href="/auth/signin/admin" className="btn-secondary rounded-full">
          Admin Login
        </Link>
        <Link href="/auth/signup" className="btn-primary rounded-full">
          Sign Up
        </Link>
      </div>
    );
  }

  const identity = session.name ? session.name : shortAddress(session.walletAddress);

  return (
    <div className="flex items-center gap-2">
      <button className="rounded-full border border-cloud/30 bg-panel px-4 py-2 text-sm text-cloud" onClick={handleLogout}>
        {identity} ({session.role})
      </button>
    </div>
  );
}
