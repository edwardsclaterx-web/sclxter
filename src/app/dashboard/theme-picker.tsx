"use client";

import { useState } from "react";
import type { WidgetTheme } from "@/lib/types";
import { WIDGET_COLORS } from "@/lib/widget-theme";

const ROWS: { key: keyof WidgetTheme; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "outline", label: "Outline" },
  { key: "text", label: "Text" },
];

function tickOn(hex: string) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#000000" : "#ffffff";
}

export function ThemePicker({
  theme,
  onChange,
  error,
}: {
  theme: WidgetTheme;
  onChange: (next: WidgetTheme) => void;
  error?: string | null;
}) {
  const [open, setOpen] = useState<keyof WidgetTheme | null>(null);

  function pick(key: keyof WidgetTheme, colour: string) {
    if (key === "primary" && colour === theme.text) return;
    if (key === "text" && colour === theme.primary) return;
    onChange({ ...theme, [key]: colour });
  }

  return (
    <section>
      <h2 className="text-xl font-medium tracking-tight">Ask anything theme</h2>
      <p className="mt-2 text-sm text-muted">
        Colours for this business’s live widget. Text and primary cannot be
        the same. Outline may match either.
      </p>
      <div className="mt-5 space-y-2">
        {ROWS.map((row) => {
          const shown = open === row.key;
          return (
            <div key={row.key}>
              <button
                type="button"
                onClick={() => setOpen(shown ? null : row.key)}
                className="text-sm text-fg"
              >
                {row.label}
              </button>
              {shown && (
                <div className="mt-2 border border-line bg-surface p-4">
                  <div className="flex flex-wrap gap-2">
                    {WIDGET_COLORS.map((c) => {
                      const selected = theme[row.key] === c;
                      const blocked =
                        (row.key === "primary" && c === theme.text) ||
                        (row.key === "text" && c === theme.primary);
                      return (
                        <button
                          key={`${row.key}-${c}`}
                          type="button"
                          disabled={blocked}
                          aria-label={`${row.label} ${c}`}
                          aria-pressed={selected}
                          title={
                            blocked
                              ? "Text and primary must be different colours."
                              : c
                          }
                          onClick={() => pick(row.key, c)}
                          className={`relative h-8 w-8 border ${
                            selected ? "border-fg" : "border-line"
                          } ${blocked ? "cursor-not-allowed opacity-30" : ""}`}
                          style={{ background: c }}
                        >
                          {selected && (
                            <svg
                              viewBox="0 0 16 16"
                              width="14"
                              height="14"
                              className="absolute inset-0 m-auto"
                              aria-hidden
                            >
                              <path
                                d="M3 8.2l3.2 3.2L13 4.4"
                                fill="none"
                                stroke={tickOn(c)}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </section>
  );
}
