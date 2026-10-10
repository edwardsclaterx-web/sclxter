"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { ChatMessage, WidgetTheme } from "@/lib/types";

type Props = {
  endpoint: string;
  welcome: string;
  assistantName: string;
  compact?: boolean;
  title?: string;
  clearable?: boolean;
  showLead?: boolean;
  extraBody?: Record<string, unknown>;
  blocked?: string | null;
  theme?: WidgetTheme;
  onLeadSaved?: () => void;
};

export function ChatPanel({
  endpoint,
  welcome,
  assistantName,
  compact,
  title,
  clearable,
  showLead = true,
  extraBody,
  blocked,
  theme,
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

  function clearChat() {
    setMessages([]);
    setError(null);
    setLeadOpen(false);
    setLeadNote(null);
    setText("");
  }

  async function send(content: string) {
    if (blocked) {
      setError(blocked);
      return;
    }
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, ...extraBody }),
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

  const themed = Boolean(theme);
  const ink = theme?.text;
  const box = theme?.primary;
  const line = theme?.outline;

  return (
    <div
      className={`flex min-h-0 flex-col overflow-visible ${compact ? "h-full" : "h-[28rem]"}`}
      style={themed ? { color: ink, background: box } : undefined}
    >
      {(title || clearable) && (
        <div
          className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b px-0.5 pb-3"
          style={themed ? { borderColor: line } : undefined}
        >
          <p className="text-xs tracking-[0.16em]">{title || "Ask anything"}</p>
          {clearable && (
            <button
              type="button"
              className={`text-xs ${themed ? "opacity-70 hover:opacity-100" : "text-muted hover:text-fg"}`}
              onClick={clearChat}
            >
              Clear chat
            </button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {blocked && (
          <p className="text-sm leading-6" style={themed ? { color: ink } : undefined}>
            {blocked}
          </p>
        )}
        {!blocked && messages.length === 0 && (
          <p className={`text-sm leading-6 ${themed ? "opacity-70" : "text-muted"}`}>
            {welcome}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <p className={`mb-1 text-[10px] uppercase tracking-[0.16em] ${themed ? "opacity-60" : "text-muted"}`}>
              {m.role === "user" ? "You" : assistantName}
            </p>
            <p
              className={
                themed
                  ? "inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6"
                  : `inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 ${
                      m.role === "user"
                        ? "bg-fg text-bg"
                        : "border border-line bg-surface"
                    }`
              }
              style={
                themed
                  ? m.role === "user"
                    ? { background: ink, color: box }
                    : { border: `1px solid ${line}`, color: ink }
                  : undefined
              }
            >
              {m.content}
            </p>
          </div>
        ))}
        {busy && <p className={`text-sm ${themed ? "opacity-70" : "text-muted"}`}>Thinking…</p>}
        {error && <p className={`text-sm ${themed ? "opacity-70" : "text-muted"}`}>{error}</p>}
        <div ref={bottom} />
      </div>

      <form
        className="mt-auto flex min-w-0 shrink-0 items-center gap-2 border-t pt-4"
        style={themed ? { borderColor: line } : undefined}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fromForm = String(new FormData(form).get("message") || "");
          const v = (fromForm || text).trim();
          if (!v || busy) return;
          void send(v);
        }}
      >
        <div className="min-w-0 flex-1">
          <Input
            name="message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={(e) => setText((e.target as HTMLInputElement).value)}
            placeholder="Ask anything"
            aria-label="Ask anything"
            disabled={Boolean(blocked)}
            className={`box-border h-10 min-h-10 max-h-10 ${themed ? "bg-transparent" : ""}`}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              ...(themed ? { borderColor: line, color: ink } : {}),
            }}
          />
        </div>
        <Button
          type="submit"
          aria-busy={busy}
          disabled={Boolean(blocked) || busy}
          className="h-10 min-h-10 max-h-10 shrink-0"
          style={
            themed
              ? {
                  background: box,
                  color: ink,
                  border: `1px solid ${line}`,
                }
              : undefined
          }
        >
          {busy ? "…" : "Send"}
        </Button>
      </form>

      {showLead && (
      <button
        type="button"
        className="mt-3 self-start text-xs tracking-wide text-muted hover:text-fg"
        onClick={() => setLeadOpen((v) => !v)}
      >
        Leave a callback
      </button>
      )}

      {showLead && leadOpen && (
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
      {showLead && leadNote && (
        <p className="mt-2 text-sm text-muted">{leadNote}</p>
      )}
    </div>
  );
}
