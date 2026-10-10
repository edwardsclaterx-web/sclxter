"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/chrome";

export function DashHeader({
  email,
  admin,
}: {
  email: string;
  admin: boolean;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Wordmark href="/" />
      <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm text-muted">
        {admin && (
          <>
            <Link href="/dashboard/businesses" className="text-fg">
              Businesses
            </Link>
            <Link href="/dashboard/messages" className="text-fg">
              Messages
            </Link>
          </>
        )}
        <span className="hidden sm:inline">{email}</span>
        <button type="button" onClick={() => void logout()} className="text-fg">
          Sign out
        </button>
      </nav>
    </header>
  );
}
