"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { ChatMessage } from "@/lib/types";

type Props = {
  endpoint: string;
  welcome: string;
  assistantName: string;
  compact?: boolean;
  onLeadSaved?: () => void;
};

export function ChatPanel({
  endpoint,
  welcome,
  assistantName,
  compact,
  onLeadSaved,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [leadNote, setLeadNote] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(content: string) {
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "The assistant is unavailable.");
        return;
      }
      setMessages([
        ...next,
        { role: "assistant", content: data.reply || "" },
      ]);
    } catch {
      setError("Could not reach the assistant.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLead(e: FormEvent) {
    e.preventDefault();
    setLeadNote(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...lead,
        publicId: new URLSearchParams(endpoint.split("?")[1] || "").get(
          "publicId",
        ),
      }),
    });
    if (!res.ok) {
      setLeadNote("Could not save those details.");
      return;
    }
    setLeadNote("Passed to the shop.");
    setLead({ name: "", phone: "", email: "", message: "" });
    setLeadOpen(false);
    onLeadSaved?.();
  }

  return (
    <div className={`flex flex-col ${compact ? "h-full" : "h-[28rem]"}`}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm leading-6 text-muted">{welcome}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted">
              {m.role === "user" ? "You" : assistantName}
            </p>
            <p
              className={`inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 ${
                m.role === "user"
                  ? "bg-fg text-bg"
                  : "border border-line bg-surface"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {busy && <p className="text-sm text-muted">Thinking…</p>}
        {error && <p className="text-sm text-muted">{error}</p>}
        <div ref={bottom} />
      </div>

      <form
        className="mt-4 flex gap-2 border-t border-line pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const v = text.trim();
          if (!v || busy) return;
          void send(v);
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask anything"
          aria-label="Ask anything"
        />
        <Button type="submit" disabled={busy || !text.trim()}>
          Send
        </Button>
      </form>

      <button
        type="button"
        className="mt-3 self-start text-xs tracking-wide text-muted hover:text-fg"
        onClick={() => setLeadOpen((v) => !v)}
      >
        Leave a callback
      </button>

      {leadOpen && (
        <form onSubmit={submitLead} className="mt-3 space-y-2 border border-line p-3">
          <Input
            placeholder="Name"
            value={lead.name}
            onChange={(e) => setLead({ ...lead, name: e.target.value })}
            required
          />
          <Input
            placeholder="Phone"
            value={lead.phone}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            required
          />
          <Input
            placeholder="Email (optional)"
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
          />
          <Input
            placeholder="Note (optional)"
            value={lead.message}
            onChange={(e) => setLead({ ...lead, message: e.target.value })}
          />
          <Button type="submit">Send details</Button>
        </form>
      )}
      {leadNote && <p className="mt-2 text-sm text-muted">{leadNote}</p>}
    </div>
  );
}
