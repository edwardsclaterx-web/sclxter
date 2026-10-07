import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-24 w-full border border-line bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-fg ${className}`}
      {...props}
    />
  );
}
