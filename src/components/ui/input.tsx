import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full border border-line bg-surface px-3 text-sm text-fg outline-none placeholder:text-muted focus:border-fg ${className}`}
      {...props}
    />
  );
}
