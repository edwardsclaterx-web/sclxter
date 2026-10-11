"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatRemaining, remainingMs } from "@/lib/cover";

export function BillingPanel({
  paidUntil,
  live,
}: {
  paidUntil: string | null;
  live: boolean;
}) {
  const [months, setMonths] = useState(1);
  const [left, setLeft] = useState(() => remainingMs(paidUntil));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [until, setUntil] = useState(paidUntil);
  const [isLive, setIsLive] = useState(live);

  useEffect(() => {
    function tick() {
      setLeft(remainingMs(until));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [until]);

  async function pay() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ months }),
      });
      const data = (await res.json()) as {
        error?: string;
        applied?: number;
        refused?: number;
        paidUntil?: string | null;
      };
      if (!res.ok) {
        setError(data.error || "Could not take that payment.");
        return;
      }
      if (data.paidUntil) {
        setUntil(data.paidUntil);
        setIsLive(Date.parse(data.paidUntil) > Date.now());
      }
      if (!data.applied) {
        setNote(
          "You already have the maximum 12 months of cover. Nothing was added.",
        );
        return;
      }
      const extra =
        data.refused && data.refused > 0
          ? ` ${data.refused} extra ${data.refused === 1 ? "month" : "months"} would have gone past the 12-month limit, so ${data.refused === 1 ? "it was" : "they were"} not added.`
          : "";
      setNote(
        `Paid for ${data.applied} ${data.applied === 1 ? "month" : "months"}.${extra}`,
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const endLabel = until
    ? new Date(until).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="text-xl font-medium tracking-tight">Subscription</h2>
        {isLive && left > 0 ? (
          <p className="mt-3 text-sm leading-7 text-muted">
            Still runs for {formatRemaining(left)}
            {endLabel ? ` (until ${endLabel})` : ""}.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted">
            The subscription has finished. Your shop data is still here. The
            live assistant is off until you pay.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-medium tracking-tight">Pay</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Add months onto whatever time you still have. Cover cannot go past 12
          months from the moment you pay. Stripe is not live yet — this records
          the same paid time dad’s payment will use later.
        </p>
        <label className="mt-6 block text-sm text-fg" htmlFor="months">
          How many months
        </label>
        <select
          id="months"
          className="mt-2 h-10 w-full max-w-xs border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-fg"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "1 month" : `${n} months`}
            </option>
          ))}
        </select>
        <Button
          type="button"
          className="mt-5"
          disabled={busy}
          onClick={() => void pay()}
        >
          {busy
            ? "Paying…"
            : `Pay for ${months === 1 ? "1 month" : `${months} months`}`}
        </Button>
        {note && <p className="mt-4 text-sm text-muted">{note}</p>}
        {error && <p className="mt-4 text-sm text-muted">{error}</p>}
      </section>
    </div>
  );
}
