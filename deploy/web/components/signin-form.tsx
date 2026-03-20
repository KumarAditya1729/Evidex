"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";

type LoginRole = "USER" | "ADMIN";

interface SigninFormProps {
  role: LoginRole;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SigninForm({ role }: SigninFormProps) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const connector = useMemo(() => connectors[0], [connectors]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!address) {
      setError("Connect your wallet before signing in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address })
      });

      if (!challengeResponse.ok) {
        const payload = await challengeResponse.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to create wallet challenge.");
      }

      const challenge = await challengeResponse.json();
      const signature = await signMessageAsync({ message: challenge.message });

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password,
          expectedRole: role,
          walletAddress: address,
          message: challenge.message,
          signature
        })
      });

      const payload = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        throw new Error(payload.error ?? "Signin failed.");
      }

      window.location.href = role === "ADMIN" ? "/admin" : "/dashboard";
    } catch (signinError) {
      setError(signinError instanceof Error ? signinError.message : "Signin failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card mx-auto flex w-full max-w-xl flex-col gap-4" onSubmit={handleSubmit}>
      <h1 className="text-3xl font-bold">{role === "ADMIN" ? "Admin Sign In" : "User Sign In"}</h1>
      <p className="text-sm text-cloud/70">
        {role === "ADMIN"
          ? "Sign in with your admin credentials and linked wallet."
          : "Sign in with your user credentials and linked wallet."}
      </p>

      {!isConnected ? (
        <button
          type="button"
          className="btn-secondary"
          disabled={isConnecting || !connector}
          onClick={() => connector && connect({ connector })}
        >
          {isConnecting ? "Connecting Wallet..." : "Connect Wallet"}
        </button>
      ) : (
        <p className="rounded-xl border border-cloud/10 bg-canvas/40 px-4 py-3 text-sm text-cloud/80">
          Connected wallet: <span className="font-mono">{shortAddress(address ?? "")}</span>
        </p>
      )}

      <label className="space-y-2 text-sm">
        <span className="text-cloud/80">Username</span>
        <input
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="yourname"
          required
        />
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-cloud/80">Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>

      {error ? <p className="text-sm text-signal">{error}</p> : null}

      <button className="btn-primary" type="submit" disabled={!isConnected || isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
