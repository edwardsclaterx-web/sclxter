"use client";

import { useEffect, useLayoutEffect, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/types";

function messagesKey(id: string) {
  return `sclxter:ask:${id}:messages`;
}
function draftKey(id: string) {
  return `sclxter:ask:${id}:draft`;
}

function loadMessages(id: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(messagesKey(id));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    );
  } catch {
    return [];
  }
}

function loadDraft(id: string) {
  try {
    return sessionStorage.getItem(draftKey(id)) || "";
  } catch {
    return "";
  }
}

export function WidgetForm({
  publicId,
  welcome,
  assistantName,
}: {
  publicId: string;
  welcome: string;
  assistantName: string;
}) {
  const endpoint = `/api/chat?publicId=${encodeURIComponent(publicId)}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    setMessages(loadMessages(publicId));
    setText(loadDraft(publicId));
    setHydrated(true);
  }, [publicId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(messagesKey(publicId), JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [hydrated, messages, publicId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(draftKey(publicId), text);
    } catch {
      /* ignore quota */
    }
  }, [hydrated, text, publicId]);

  async function send(content: string) {
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      sessionStorage.setItem(draftKey(publicId), "");
      sessionStorage.setItem(messagesKey(publicId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply || data.error || "The assistant is unavailable.";
      const withReply: ChatMessage[] = [
        ...next,
        { role: "assistant", content: reply },
      ];
      setMessages(withReply);
      try {
        sessionStorage.setItem(
          messagesKey(publicId),
          JSON.stringify(withReply),
        );
      } catch {
        /* ignore */
      }
      if (!res.ok) setError(data.error || "The assistant is unavailable.");
    } catch {
      setError("Could not reach the assistant.");
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setText("");
    setError(null);
    setBusy(false);
    try {
      sessionStorage.removeItem(messagesKey(publicId));
      sessionStorage.removeItem(draftKey(publicId));
    } catch {
      /* ignore */
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    const fromForm = String(
      new FormData(e.currentTarget).get("message") || "",
    );
    const v = (fromForm || text).trim();
    if (!v || busy) return;
    void send(v);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
        <p className="text-xs tracking-[0.16em]">Ask anything</p>
        <button
          id="wa-clear"
          type="button"
          className="text-xs text-muted hover:text-fg"
          onClick={clearChat}
        >
          Clear chat
        </button>
      </div>
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
      </div>
      <form
        className="mt-4 flex gap-2 border-t border-line pt-4"
        onSubmit={onSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          id="wa-input"
          name="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          className="h-10 w-full border border-line bg-surface px-3 text-sm text-fg outline-none placeholder:text-muted focus:border-fg"
          placeholder="Ask anything"
          aria-label="Ask anything"
          autoComplete="off"
        />
        <button
          id="wa-send"
          type="submit"
          style={{
            display: "inline-flex",
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            border: 0,
            borderRadius: 9999,
            background: "#ffffff",
            color: "#050505",
            fontSize: 14,
            letterSpacing: "0.04em",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            opacity: 1,
            pointerEvents: "auto",
          }}
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
