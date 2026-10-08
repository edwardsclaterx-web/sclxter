"use client";

import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/password-field";

export function BlankEntry() {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/n", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
      });
      if (res.ok) {
        window.location.assign("/dashboard");
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
      <button
        type="submit"
        disabled={busy}
        className="ml-1 inline-block h-10 w-10 border border-line bg-surface"
        aria-label=" "
      />
    </form>
  );
}
