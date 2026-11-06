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
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        months?: number;
        url?: string;
      };
      if (!res.ok) {
        setError(body.error || "That code could not be applied.");
        return;
      }
      if (body.url) {
        window.location.assign(body.url);
        return;
      }
      const months = Number(body.months);
      const q =
        Number.isFinite(months) && months >= 1
          ? `?paid=1&months=${Math.floor(months)}`
          : "?paid=1";
      window.location.assign(`/buy${q}`);
    } catch {
      setError("That code could not be applied.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
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
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={busy || !code.trim()}
        >
          {busy ? "Applying…" : "Apply"}
        </Button>
      </div>
      {error ? <p className="text-sm text-fg">{error}</p> : null}
    </form>
  );
}
