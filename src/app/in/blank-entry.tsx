"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/password-field";

export function BlankEntry() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login/second", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch {
      /* stay */
    } finally {
      setBusy(false);
    }
  }

  return (
    <form method="post" action="/api/auth/login/second" onSubmit={onSubmit}>
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
