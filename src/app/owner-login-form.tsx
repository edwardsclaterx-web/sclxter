"use client";

import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/chrome";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OwnerLoginForm({ error }: { error?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(error ?? null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setLocalError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        next?: string;
      };
      if (!res.ok) {
        setLocalError(body.error || "Those details did not match.");
        return;
      }
      window.location.assign(body.next === "in" ? "/in" : "/dashboard");
    } catch {
      setLocalError("Those details did not match.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/auth/login"
      encType="application/x-www-form-urlencoded"
      className="mt-8 space-y-5"
      autoComplete="on"
      onSubmit={onSubmit}
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
      <FieldError>{localError}</FieldError>
      <Button type="submit" className="w-full" disabled={busy}>
        Continue
      </Button>
    </form>
  );
}
