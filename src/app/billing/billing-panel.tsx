"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatRemaining, remainingMs } from "@/lib/cover";

const SETUP = 299.99;
const MONTH = 74.99;

function gbp(n: number) {
  return n.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

export function BillingPanel({
  paidUntil,
  live,
  setupPaid,
  maxMonths,
  checkoutReady,
  notice,
}: {
  paidUntil: string | null;
  live: boolean;
  setupPaid: boolean;
  maxMonths: number;
  checkoutReady: boolean;
  notice?: string | null;
}) {
  const [left, setLeft] = useState(() => remainingMs(paidUntil));
  const [until] = useState(paidUntil);
  const [isLive] = useState(live);
  const [months, setMonths] = useState(maxMonths >= 1 ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setLeft(remainingMs(until));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [until]);

  const endLabel = until
    ? new Date(until).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const total = useMemo(() => {
    if (months < 1) return 0;
    return (setupPaid ? 0 : SETUP) + months * MONTH;
  }, [months, setupPaid]);

  async function onPay(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ months }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url) {
        setError(body.error || "Could not start checkout.");
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 space-y-10">
      {notice ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm leading-6">
          {notice}
        </p>
      ) : null}

      <section>
        <h2 className="text-xl font-medium tracking-tight">Subscription</h2>
        {isLive && left > 0 ? (
          <p className="mt-3 text-sm leading-7 text-muted">
            Time left: {formatRemaining(left)}
            {endLabel ? ` (until ${endLabel})` : ""}.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted">
            No paid time on this account. Your shop data is still here. The
            live assistant stays off until cover is current.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-medium tracking-tight">Pay</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          {gbp(SETUP)} setup
          {setupPaid ? " (already paid on this account)" : ""}, then {gbp(MONTH)}{" "}
          a month. Buy 1 to 12 months, never more than 12 months ahead.
        </p>

        {!checkoutReady ? (
          <p className="mt-4 text-sm leading-7 text-muted">
            Card payments are not configured on this server.
          </p>
        ) : maxMonths < 1 ? (
          <p className="mt-4 text-sm leading-7 text-muted">
            You already have the maximum 12 months of cover.
          </p>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={onPay}>
            <div>
              <Label htmlFor="months">Months</Label>
              <select
                id="months"
                name="months"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1.5 h-10 w-full border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-fg"
              >
                {Array.from({ length: maxMonths }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "month" : "months"}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted">Due now: {gbp(total)}</p>
            {error ? <p className="text-sm text-fg">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Starting checkout…" : "Pay with card"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
