"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FieldError } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  INSTRUCTIONS_KICKER,
  INSTRUCTIONS_TITLE,
} from "@/lib/instructions";

export function InstructionsBanner({
  steps,
  admin,
}: {
  steps: string[];
  admin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState(steps);
  const [draft, setDraft] = useState(steps.join("\n\n"));
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCopy(steps);
    setDraft(steps.join("\n\n"));
  }, [steps]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNote(null);
    const next = draft
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch("/api/admin/instructions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instructions: next }),
      });
      const data = (await res.json()) as {
        error?: string;
        instructions?: string[];
      };
      if (!res.ok || !data.instructions) {
        setError(data.error || "Could not save.");
        return;
      }
      setCopy(data.instructions);
      setDraft(data.instructions.join("\n\n"));
      setNote("Saved for every business.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

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
            {admin && (
              <form onSubmit={save} className="mt-10 space-y-3 border-t border-line pt-6">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  Edit for every business
                </p>
                <Textarea
                  className="min-h-48"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label="Instruction steps"
                />
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save instructions"}
                </Button>
                {note && <p className="text-sm text-muted">{note}</p>}
                <FieldError>{error}</FieldError>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
