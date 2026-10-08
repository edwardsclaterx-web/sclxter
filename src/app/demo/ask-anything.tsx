"use client";

import { useEffect, useState } from "react";
import { DEMO_PUBLIC_ID } from "@/lib/seed";

export function AskAnything() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetch(`/api/widget/${DEMO_PUBLIC_ID}`).catch(() => {});
  }, []);

  return (
    <>
      {open && (
        <div className="fixed right-5 bottom-[4.75rem] z-50 h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2.5rem))] overflow-hidden border border-line bg-bg">
          <iframe
            title="Ask anything"
            src={`/widget/${DEMO_PUBLIC_ID}`}
            className="h-full w-full border-0 bg-bg"
          />
        </div>
      )}
      <button
        type="button"
        aria-label="Ask anything"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed right-5 bottom-5 z-50 h-11 bg-accent px-5 text-sm tracking-wide text-accent-fg"
      >
        Ask anything
      </button>
    </>
  );
}
