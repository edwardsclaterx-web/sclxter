export type WidgetTheme = {
  outline: string;
  primary: string;
  text: string;
};

export const WIDGET_COLORS = [
  "#000000",
  "#ffffff",
  "#222222",
  "#6b7280",
  "#9ca3af",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#78716c",
  "#0d9488",
  "#1d4ed8",
] as const;

export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  outline: "#222222",
  primary: "#ffffff",
  text: "#000000",
};

const ALLOWED = new Set<string>(
  WIDGET_COLORS.map((c) => c.toLowerCase()),
);

export function canonColor(value: string) {
  const v = value.trim().toLowerCase();
  return ALLOWED.has(v) ? v : null;
}

export function isWidgetColor(value: string) {
  return canonColor(value) !== null;
}

export function normalizeTheme(raw?: Partial<WidgetTheme> | null): WidgetTheme {
  const outline = canonColor(raw?.outline || "") || DEFAULT_WIDGET_THEME.outline;
  let primary = canonColor(raw?.primary || "") || DEFAULT_WIDGET_THEME.primary;
  let text = canonColor(raw?.text || "") || DEFAULT_WIDGET_THEME.text;
  if (primary === text) {
    text =
      primary === DEFAULT_WIDGET_THEME.text
        ? DEFAULT_WIDGET_THEME.primary
        : DEFAULT_WIDGET_THEME.text;
  }
  return { outline, primary, text };
}

export function parseThemeInput(raw: unknown): WidgetTheme | "same" | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const outline = typeof o.outline === "string" ? canonColor(o.outline) : null;
  const primary = typeof o.primary === "string" ? canonColor(o.primary) : null;
  const text = typeof o.text === "string" ? canonColor(o.text) : null;
  if (!outline || !primary || !text) return null;
  if (primary === text) return "same";
  return { outline, primary, text };
}
