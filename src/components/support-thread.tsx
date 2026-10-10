"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupportMessage } from "@/lib/types";

function stamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function SupportThread({
  endpoint,
  autoFocus,
}: {
  endpoint: string;
  autoFocus?: boolean;
}) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(endpoint);
    const data = (await res.json()) as { messages?: SupportMessage[]; error?: string };
    if (!res.ok) {
      setError(data.error || "Could not load messages.");
      return;
    }
    setMessages(data.messages ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, [endpoint]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!autoFocus) return;
    document.getElementById("support")?.scrollIntoView({ block: "start" });
    document.getElementById("support-input")?.focus();
  }, [autoFocus]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          seq: Number(new URLSearchParams(endpoint.split("?")[1] || "").get("seq")) || undefined,
        }),
      });
      const data = (await res.json()) as { messages?: SupportMessage[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not send.");
        return;
      }
      setMessages(data.messages ?? []);
      setText("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="support" className="flex min-h-[22rem] flex-col border border-line">
      <div ref={box} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.from === "owner";
            return (
              <div key={m.id} className={mine ? "text-right" : "text-left"}>
                <p className="text-[10px] leading-4 text-muted">{stamp(m.createdAt)}</p>
                {!mine && (
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                    Administrator
                  </p>
                )}
                <p className="mt-1 inline-block max-w-[90%] whitespace-pre-wrap border border-line bg-surface px-3 py-2 text-sm leading-6">
                  {m.content}
                </p>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <Input
          id="support-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          aria-label="Message"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "Send"}
        </Button>
      </form>
      {error && <p className="px-3 pb-3 text-sm text-muted">{error}</p>}
    </div>
  );
}
