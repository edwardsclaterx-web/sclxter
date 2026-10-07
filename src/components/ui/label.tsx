import type { LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted ${className}`}
      {...props}
    />
  );
}
