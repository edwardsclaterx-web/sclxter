import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const look =
    variant === "primary"
      ? "bg-accent text-accent-fg hover:opacity-90"
      : variant === "ghost"
        ? "border border-line bg-transparent text-fg hover:bg-surface-2"
        : "text-muted hover:text-fg";
  return (
    <button
      className={`inline-flex h-10 items-center justify-center px-4 text-sm tracking-wide disabled:opacity-40 ${look} ${className}`}
      {...props}
    />
  );
}
