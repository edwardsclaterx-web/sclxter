"use client";

import { useEffect, useState } from "react";
import { formatRemaining, remainingMs } from "@/lib/cover";

export function BillingPanel({
  paidUntil,
  live,
}: {
  paidUntil: string | null;
  live: boolean;
}) {
  const [left, setLeft] = useState(() => remainingMs(paidUntil));
  const [until] = useState(paidUntil);
  const [isLive] = useState(live);

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

  return (
    <div className="mt-10 space-y-10">
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
          £299.99 setup, then £74.99 a month. Card payments when Stripe is
          live. Nothing on this page takes a card or adds free months.
        </p>
      </section>
    </div>
  );
}
