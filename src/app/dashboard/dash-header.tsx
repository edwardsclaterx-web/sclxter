"use client";

import { useRouter } from "next/navigation";
import { ProductNav, Wordmark } from "@/components/chrome";

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
      <ProductNav
        signedIn
        admin={admin}
        showPricing={false}
        showBuy={false}
        tail={
          <>
            <span className="hidden sm:inline">{email}</span>
            <button type="button" onClick={() => void logout()} className="text-fg">
              Sign out
            </button>
          </>
        }
      />
    </header>
  );
}
