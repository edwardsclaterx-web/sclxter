"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/password-field";

export function BlankEntry() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
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
        redirect: "manual",
      });
      if (res.ok || res.type === "opaqueredirect" || res.status === 0) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch {
      form.submit();
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
