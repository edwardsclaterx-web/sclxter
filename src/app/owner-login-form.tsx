"use client";

import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/chrome";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OwnerLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const payload = (await res.json()) as { error?: string; ok?: boolean };
        if (!res.ok) {
          setError(payload.error || "That did not work.");
          return;
        }
      } else if (!res.ok) {
        setError("That did not work.");
        return;
      }
      window.location.assign("/in");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/auth/login"
      encType="application/x-www-form-urlencoded"
      onSubmit={onSubmit}
      className="mt-8 space-y-5"
      autoComplete="on"
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue="sclxter@outlook.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="current-password"
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
