"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RedeemForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "That code could not be applied.");
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setError("That code could not be applied.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div>
        <Label htmlFor="free-code">Code</Label>
        <Input
          id="free-code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="SCLX-7KQ2-M9PD"
          aria-label="Free access code"
        />
      </div>
      {error ? <p className="text-sm text-fg">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={busy || !code.trim()}>
        {busy ? "Applying…" : "Apply code"}
      </Button>
    </form>
  );
}
