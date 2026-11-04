"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CodeRow = {
  code: string;
  months: number;
  createdAt: string;
  usedAt?: string;
  usedByBusinessName?: string;
};

function when(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FreeCodesPanel() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/codes", { credentials: "same-origin" });
    const body = (await res.json().catch(() => ({}))) as {
      codes?: CodeRow[];
      error?: string;
    };
    if (!res.ok) {
      setError(body.error || "Could not load codes.");
      return;
    }
    setCodes(body.codes || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy(true);
    setError(null);
    setMade(null);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ months }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        code?: CodeRow;
        error?: string;
      };
      if (!res.ok || !body.code) {
        setError(body.error || "Could not create that code.");
        return;
      }
      setMade(body.code.code);
      await load();
    } catch {
      setError("Could not create that code.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(code: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "Could not delete that code.");
        return;
      }
      if (made === code) setMade(null);
      await load();
    } catch {
      setError("Could not delete that code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="text-2xl font-medium tracking-tight">Free codes</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        One-time codes for a signed-in business. They skip card payment, mark
        setup as paid, and add 1 to 12 months of cover, still capped at 12
        months ahead.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <Label htmlFor="free-months">Months</Label>
          <select
            id="free-months"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="mt-1.5 h-10 border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-fg"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "month" : "months"}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" disabled={busy} onClick={() => void generate()}>
          {busy ? "Working…" : "Generate code"}
        </Button>
      </div>
      {made ? (
        <p className="mt-4 font-mono text-sm text-fg">
          New code: {made}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-fg">{error}</p> : null}

      {codes.length === 0 ? (
        <p className="mt-8 border border-dashed border-line px-4 py-8 text-sm text-muted">
          No codes yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
                <th className="py-3 pr-4 font-normal">Code</th>
                <th className="py-3 pr-4 font-normal">Months</th>
                <th className="py-3 pr-4 font-normal">Status</th>
                <th className="py-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => (
                <tr key={row.code} className="border-b border-line">
                  <td className="py-3 pr-4 font-mono text-fg">{row.code}</td>
                  <td className="py-3 pr-4 text-muted">{row.months}</td>
                  <td className="py-3 pr-4 text-muted">
                    {row.usedAt
                      ? `Used by ${row.usedByBusinessName || "a business"} on ${when(row.usedAt)}`
                      : "Unused"}
                  </td>
                  <td className="py-3 text-right">
                    {row.usedAt ? null : (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void remove(row.code)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
