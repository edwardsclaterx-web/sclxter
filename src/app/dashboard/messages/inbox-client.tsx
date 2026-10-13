"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SupportThread } from "@/components/support-thread";

export type InboxRow = {
  seq: number;
  name: string;
  unread: boolean;
  updatedAt: string;
  lastWhen: string;
  lastPreview: string;
};

export function MessagesInbox({ rows }: { rows: InboxRow[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows;
    if (needle) {
      list = rows.filter(
        (r) =>
          String(r.seq).includes(needle) ||
          (r.name || "").toLowerCase().includes(needle),
      );
    }
    return [...list].sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [rows, q]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <h1 className="text-2xl font-medium tracking-tight">Messages</h1>
      <div className="mt-6 max-w-md">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search id or name"
          aria-label="Search messages"
        />
      </div>
      {shown.length === 0 ? (
        <p className="mt-10 border border-dashed border-line px-4 py-10 text-sm text-muted">
          No messages yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line">
          {shown.map((r) => (
            <li key={r.seq}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface"
                onClick={() => setOpen((n) => (n === r.seq ? null : r.seq))}
              >
                {r.unread ? (
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600"
                    aria-label="Unread"
                  />
                ) : (
                  <span className="inline-block h-2 w-2 shrink-0" />
                )}
                <span className="min-w-0 flex-1 text-sm font-medium text-fg">
                  {r.name || "Untitled"}
                </span>
                {r.lastWhen ? (
                  <span className="shrink-0 text-sm text-muted">
                    {r.lastWhen}
                  </span>
                ) : null}
              </button>
              {open === r.seq && (
                <div className="border-t border-line p-4">
                  <SupportThread
                    endpoint={`/api/support?seq=${r.seq}`}
                    viewer="admin"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
