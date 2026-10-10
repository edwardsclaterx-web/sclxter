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

function navClass(className?: string, active?: boolean) {
  return [className, active ? "nav-current px-1 -mx-1 pb-1.5" : null]
    .filter(Boolean)
    .join(" ");
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
  const onDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  const onFaq = pathname === "/faq";
  const onContact = pathname === "/contact";
  const onLogin = pathname === "/login";
  const onSignup = pathname === "/signup";
  const onAccount = pathname === "/account";
  const onMessages = pathname === "/dashboard/messages" || pathname.startsWith("/dashboard/messages/");
  const onBusinesses =
    pathname === "/dashboard/businesses" ||
    pathname.startsWith("/dashboard/businesses/");
  const onMyDash =
    pathname === "/dashboard" ||
    (pathname.startsWith("/dashboard/") && !onMessages && !onBusinesses);

  return (
    <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm text-muted">
      {showHome && (
        <Link href="/" className={navClass(undefined, onHome)}>
          Home
        </Link>
      )}
      {showPricing && (
        <Link href="/#pricing" className={navClass()}>
          Pricing
        </Link>
      )}
      <Link href="/demo" className={navClass(undefined, onDemo)}>
        Demo
      </Link>
      <Link href="/faq" className={navClass(undefined, onFaq)}>
        FAQ
      </Link>
      <Link href="/contact" className={navClass(undefined, onContact)}>
        Contact
      </Link>
      {extra}
      {admin ? (
        <>
          <Link
            href="/dashboard/businesses"
            className={navClass(undefined, onBusinesses)}
          >
            Businesses
          </Link>
          <Link
            href="/dashboard/messages"
            className={navClass(undefined, onMessages)}
          >
            Messages
          </Link>
        </>
      ) : signedIn ? (
        <Link
          href="/dashboard"
          className={navClass("text-fg", onMyDash)}
        >
          My dashboard
        </Link>
      ) : (
        <>
          <Link href="/login" className={navClass(undefined, onLogin)}>
            Sign in
          </Link>
          {showBuy && (
            <Link
              href="/signup"
              className={navClass("text-fg", onSignup)}
            >
              Buy
            </Link>
          )}
        </>
      )}
      {signedIn || admin ? (
        <Link href="/account" className={navClass(undefined, onAccount)}>
          Sign out
        </Link>
      ) : null}
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
