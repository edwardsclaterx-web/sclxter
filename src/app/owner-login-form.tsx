"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OwnerLoginForm({ secondStep }: { secondStep: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(secondStep ? 2 : 1);
  const [email, setEmail] = useState("sclxter@outlook.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFirst(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; next?: string };
      if (!res.ok) {
        setError(data.error || "That did not work.");
        return;
      }
      setPassword("");
      setStep(2);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function onSecond(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/second", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "That did not work.");
        if (res.status === 401 && data.error?.includes("first sign-in")) {
          setStep(1);
          setPassword("");
        }
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (step === 2) {
    return (
      <form onSubmit={onSecond} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="password-two">Second password</Label>
          <Input
            id="password-two"
            name="password-two"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Please wait…" : "Continue"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onFirst} className="mt-8 space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">First password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Please wait…" : "Continue"}
      </Button>
    </form>
  );
}
