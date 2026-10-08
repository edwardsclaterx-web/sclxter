"use client";

import { useState } from "react";

export function PasswordField({
  id,
  name,
  autoComplete,
  required,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="h-10 w-full border border-line bg-surface px-3 pr-10 text-sm text-fg outline-none placeholder:text-muted focus:border-fg"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={shown ? "Hide" : "Show"}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted hover:text-fg"
        onClick={() => setShown((v) => !v)}
      >
        {shown ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M9.9 5.1A11 11 0 0121 12a11 11 0 01-1.7 2.5M6.1 6.1A11 11 0 003 12a11 11 0 009 7.5c1.5 0 2.9-.3 4.2-.9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </button>
    </div>
  );
}
