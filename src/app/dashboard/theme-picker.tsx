"use client";

import type { WidgetTheme } from "@/lib/types";
import { WIDGET_COLORS } from "@/lib/widget-theme";

const ROWS: { key: keyof WidgetTheme; label: string }[] = [
  { key: "outline", label: "Outline" },
  { key: "primary", label: "Primary" },
  { key: "text", label: "Text" },
];

export function ThemePicker({
  theme,
  onChange,
  error,
}: {
  theme: WidgetTheme;
  onChange: (next: WidgetTheme) => void;
  error?: string | null;
}) {
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
      <div className="mt-5 space-y-5">
        {ROWS.map((row) => (
          <div key={row.key}>
            <p className="text-sm text-fg">{row.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
                    className={`h-7 w-7 border ${
                      selected ? "border-fg" : "border-line"
                    } ${blocked ? "cursor-not-allowed opacity-30" : ""}`}
                    style={{ background: c }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </section>
  );
}
