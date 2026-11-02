"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FieldError } from "@/components/chrome";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({
  mode,
  error,
}: {
  mode: "login" | "signup";
  error?: string | null;
}) {
  const signup = mode === "signup";
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(error ?? null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    if (signup && !accepted) {
      setLocalError("Accept the Terms of Service to create an account.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const res = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          password,
          ...(signup ? { terms: true } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        next?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setLocalError(body.error || "Those details did not match.");
        return;
      }
      window.location.assign(body.next || "/dashboard");
    } catch {
      setLocalError("Those details did not match.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      method="post"
      action={signup ? "/api/auth/signup" : "/api/auth/login"}
      encType="application/x-www-form-urlencoded"
      className="mt-8 space-y-5"
      autoComplete={signup ? "off" : "on"}
      onSubmit={onSubmit}
    >
      <div>
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          name="email"
          type={signup ? "email" : "text"}
          autoComplete={signup ? "email" : "off"}
          inputMode={signup ? "email" : "text"}
          defaultValue=""
          required
        />
      </div>
      <div>
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <PasswordField
          id={`${mode}-password`}
          name="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          required
        />
      </div>
      {signup ? (
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm leading-6 text-muted">
            <input
              type="checkbox"
              name="terms"
              value="1"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-white"
              required
            />
            <span>
              I accept the{" "}
              <Link href="/terms" className="text-fg underline underline-offset-2">
                Terms of Service
              </Link>
            </span>
          </label>
          <p className="text-sm leading-6 text-muted">
            Visitor chats on your site are processed under the{" "}
            <Link href="/dpa" className="text-fg underline underline-offset-2">
              Data Processing Addendum
            </Link>
            .
          </p>
        </div>
      ) : null}
      <FieldError>{localError}</FieldError>
      <Button
        type="submit"
        className="w-full"
        disabled={busy || (signup && !accepted)}
      >
        {signup ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
