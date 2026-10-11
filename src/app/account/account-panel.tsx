"use client";

import { useState, type MouseEvent } from "react";

export function AccountPanel({
  email,
  password,
  showPassword = false,
}: {
  email: string;
  password: string;
  showPassword?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle(e: MouseEvent) {
    e.preventDefault();
    setShown((v) => !v);
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Email</p>
        <p className="mt-2 text-sm">{email}</p>
      </div>
      {showPassword ? <div>
        <p className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted">
          Password
        </p>
        <div className="relative">
          <input
            id="account-password"
            type={shown ? "text" : "password"}
            value={password}
            readOnly
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="password-entry h-10 w-full border border-line bg-surface px-3 pr-10 text-sm text-fg outline-none focus:border-fg"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={shown ? "Hide" : "Show"}
            className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted hover:text-fg"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
          >
            {shown ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="pointer-events-none">
                <path
                  d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M9.9 5.1A11 11 0 0121 12a11 11 0 01-1.7 2.5M6.1 6.1A11 11 0 003 12a11 11 0 009 7.5c1.5 0 2.9-.3 4.2-.9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="pointer-events-none">
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
      </div> : (
        <p className="text-sm leading-7 text-muted">
          The password is stored hashed. It is not shown here.
        </p>
      )}
      <button type="button" onClick={() => setAsk(true)} className="text-sm text-fg">
        Sign out
      </button>
      {ask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/40">
          <div className="w-full max-w-sm border border-line bg-bg px-6 py-5">
            <p className="text-sm">Are you sure you want to sign out</p>
            <div className="mt-6 flex justify-end gap-6 text-sm">
              <button
                type="button"
                disabled={busy}
                onClick={() => void logout()}
                className="text-fg"
              >
                Yes
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAsk(false)}
                className="text-muted"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
