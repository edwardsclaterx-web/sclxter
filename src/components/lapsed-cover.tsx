"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LapsedCoverOverlay() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    let stop = false;
    async function check() {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const body = (await res.json().catch(() => ({}))) as { live?: boolean };
        if (stop || !body.live) return;
        setCleared(true);
        router.refresh();
      } catch {
        /* keep overlay until cover is current */
      }
    }
    check();
    const id = window.setInterval(check, 1500);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [router]);

  if (cleared) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/55 px-5">
      <p className="max-w-xl text-center font-sans text-[28px] font-medium leading-snug tracking-tight text-white sm:text-4xl">
        Renew subscription to continue using
      </p>
      <Link
        href="/billing"
        className="mt-8 inline-flex h-11 items-center justify-center bg-white px-6 text-sm font-medium tracking-wide text-black"
      >
        Go to Billing
      </Link>
    </div>
  );
}
