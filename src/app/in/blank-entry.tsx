"use client";

import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/password-field";

export function BlankEntry() {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    const n = String(data.get("n") ?? "");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/n", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ password, n }),
        credentials: "same-origin",
      });
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { next?: string };
        window.location.replace(body.next || "/dashboard/businesses");
        return;
      }
    } catch {
      /* stay */
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/auth/n"
      encType="application/x-www-form-urlencoded"
      onSubmit={onSubmit}
    >
      <PasswordField id="password" name="password" autoComplete="off" />
      <div className="mt-1 flex items-center">
        <input
          name="n"
          type="text"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="h-10 w-10 border border-line bg-surface px-1 text-center text-sm text-fg outline-none focus:border-fg"
        />
        <button
          type="submit"
          disabled={busy}
          className="ml-1 inline-block h-10 w-10 border border-line bg-surface"
          aria-label=" "
        />
      </div>
    </form>
  );
}
