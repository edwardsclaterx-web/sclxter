"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_INSTRUCTION_STEPS,
  INSTRUCTIONS_KICKER,
  INSTRUCTIONS_TITLE,
} from "@/lib/instructions";

export function InstructionsBanner({
  steps,
}: {
  steps?: string[];
  admin?: boolean;
}) {
  const copy = steps?.length ? steps : [...DEFAULT_INSTRUCTION_STEPS];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-line bg-surface px-[1.875rem] py-6 text-left"
      >
        <p className="text-2xl font-bold tracking-wide text-fg">
          {INSTRUCTIONS_TITLE}
        </p>
        <p className="mt-2 text-[1.3125rem] leading-snug text-muted">
          {INSTRUCTIONS_KICKER}
        </p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/40"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="instructions-title"
            className="relative h-[82vh] w-[82vw] overflow-auto border border-line bg-bg p-6 md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-lg text-fg"
              onClick={() => setOpen(false)}
            >
              X
            </button>
            <h2
              id="instructions-title"
              className="pr-12 text-2xl font-bold tracking-wide text-fg"
            >
              {INSTRUCTIONS_TITLE}
            </h2>
            <ol className="mt-6 list-decimal space-y-4 pl-5 text-base leading-7 text-fg">
              {copy.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
