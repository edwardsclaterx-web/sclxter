"use client";

import { useEffect, useState } from "react";

export const SUPPORT_UNREAD_EVENT = "sclxter-support-unread";

export function notifySupportUnread() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SUPPORT_UNREAD_EVENT));
}

export function ContactLabel({
  stacked,
  enabled,
}: {
  stacked?: boolean;
  enabled?: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    let stop = false;
    async function load() {
      try {
        const res = await fetch("/api/support/unread", { cache: "no-store" });
        const data = (await res.json()) as { count?: number };
        if (!stop && typeof data.count === "number") {
          setCount(data.count > 0 ? data.count : 0);
        }
      } catch {
        /* keep last */
      }
    }
    void load();
    const tick = window.setInterval(() => {
      void load();
    }, 5000);
    const onChange = () => {
      void load();
    };
    window.addEventListener(SUPPORT_UNREAD_EVENT, onChange);
    window.addEventListener("focus", onChange);
    return () => {
      stop = true;
      window.clearInterval(tick);
      window.removeEventListener(SUPPORT_UNREAD_EVENT, onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [enabled]);

  const label = stacked ? "text-[22px] font-medium tracking-tight" : "";

  return (
    <span className={`relative inline-block pr-3 ${label}`}>
      Contact
      {count > 0 ? (
        <span
          className="absolute -top-1.5 right-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white"
          aria-label={
            count === 1 ? "1 unread message" : `${count} unread conversations`
          }
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </span>
  );
}
