"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-sm tracking-[0.28em]">
      sclxter
    </Link>
  );
}

export function ProductNav({
  signedIn,
  admin,
  extra,
  tail,
  showPricing = true,
  showBuy = true,
}: {
  signedIn?: boolean;
  admin?: boolean;
  extra?: ReactNode;
  tail?: ReactNode;
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  const pathname = usePathname() || "/";
  const onHome = pathname === "/";
  const showHome = !onHome && !admin;

  return (
    <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm text-muted">
      {showHome && <Link href="/">Home</Link>}
      {showPricing && <Link href="/#pricing">Pricing</Link>}
      <Link href="/demo">Demo</Link>
      <Link href="/faq">FAQ</Link>
      <Link href="/contact">Contact</Link>
      {extra}
      {admin ? (
        <>
          <Link href="/dashboard/businesses">Businesses</Link>
          <Link href="/dashboard/messages">Messages</Link>
        </>
      ) : signedIn ? (
        <Link href="/dashboard" className="text-fg">
          My dashboard
        </Link>
      ) : (
        <>
          <Link href="/login">Sign in</Link>
          {showBuy && (
            <Link href="/signup" className="text-fg">
              Buy
            </Link>
          )}
        </>
      )}
      {signedIn || admin ? <Link href="/account">Sign out</Link> : null}
      {tail}
    </nav>
  );
}

export function SiteHeader({
  right,
  signedIn,
  admin,
  extra,
  tail,
  showPricing,
  showBuy,
}: {
  right?: ReactNode;
  signedIn?: boolean;
  admin?: boolean;
  extra?: ReactNode;
  tail?: ReactNode;
  lowercase?: boolean;
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Wordmark href="/" />
      {right ?? (
        <ProductNav
          signedIn={signedIn}
          admin={admin}
          extra={extra}
          tail={tail}
          showPricing={showPricing}
          showBuy={showBuy}
        />
      )}
    </header>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-muted">{children}</p>;
}
