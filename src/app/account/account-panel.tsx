"use client";

import { useState } from "react";

export function AccountPanel({ email }: { email: string }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <p className="text-sm leading-7 text-muted">
        The password is stored hashed. It is not shown here.
      </p>
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
