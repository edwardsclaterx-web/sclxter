"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/cover";

const DISMISS = "sclxter:renew-warn:dismiss";

export function RenewWarning({ paidUntil }: { paidUntil: string }) {
  const [hidden, setHidden] = useState(true);
  const [left, setLeft] = useState(() => Date.parse(paidUntil) - Date.now());

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS) === "1") return;
    } catch {
      /* show */
    }
    setHidden(false);
  }, []);

  useEffect(() => {
    function tick() {
      setLeft(Date.parse(paidUntil) - Date.now());
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [paidUntil]);

  if (hidden || left <= 0) return null;

  function close() {
    try {
      sessionStorage.setItem(DISMISS, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/55 px-4">
      <div className="relative w-full max-w-lg border-2 border-red-600 bg-bg px-6 py-8 text-center">
        <button
          type="button"
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-red-500"
          onClick={close}
        >
          X
        </button>
        <p className="text-base leading-7 text-red-500">
          WARNING - subscription finishes in {formatRemaining(left)} go to{" "}
          <Link href="/billing" className="underline">
            Billing
          </Link>{" "}
          to renew the subscription
        </p>
      </div>
    </div>
  );
}
