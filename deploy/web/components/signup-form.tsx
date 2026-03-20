"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SignupForm() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const connector = useMemo(() => connectors[0], [connectors]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!address) {
      setError("Connect your wallet before signing up.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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

      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password,
          walletAddress: address,
          message: challenge.message,
          signature
        })
      });

      const payload = await signupResponse.json().catch(() => ({}));
      if (!signupResponse.ok) {
        throw new Error(payload.error ?? "Signup failed.");
      }

      window.location.href = payload.user?.role === "ADMIN" ? "/admin" : "/dashboard";
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card mx-auto flex w-full max-w-xl flex-col gap-4" onSubmit={handleSubmit}>
      <h1 className="text-3xl font-bold">Create account</h1>
      <p className="text-sm text-cloud/70">
        Register with a username, password, and wallet signature.
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
          placeholder="Minimum 8 characters"
          minLength={8}
          required
        />
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-cloud/80">Confirm password</span>
        <input
          className="input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>

      {error ? <p className="text-sm text-signal">{error}</p> : null}

      <button className="btn-primary" type="submit" disabled={!isConnected || isSubmitting}>
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
