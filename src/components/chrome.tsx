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
  return ["nav-item", className, active ? "here" : null].filter(Boolean).join(" ");
}

export function ProductNav({
  signedIn,
  admin,
  purchaser,
  extra,
  tail,
  showPricing = true,
}: {
  signedIn?: boolean;
  admin?: boolean;
  purchaser?: boolean;
  extra?: ReactNode;
  tail?: ReactNode;
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  const pathname = usePathname() || "/";
  const onHome = pathname === "/";
  const onDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  const onFaq = pathname === "/faq";
  const onContact = pathname === "/contact";
  const onAccount =
    pathname === "/account" ||
    pathname === "/login" ||
    pathname === "/signup";
  const onBilling = pathname === "/billing" || pathname.startsWith("/billing/");
  const onMessages = pathname === "/dashboard/messages" || pathname.startsWith("/dashboard/messages/");
  const onBusinesses =
    pathname === "/dashboard/businesses" ||
    pathname.startsWith("/dashboard/businesses/");
  const billing = Boolean(purchaser) && !admin;
  const owner = Boolean(signedIn) && !admin;

  return (
    <nav className="flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2 text-sm text-muted">
      {!admin && (
        <Link href="/" className={navClass(undefined, onHome)}>
          Home
        </Link>
      )}
      {owner && (
        <Link href="/dashboard" className={navClass("text-fg")}>
          My dashboard
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
      ) : null}
      {billing ? (
        <Link href="/billing" className={navClass(undefined, onBilling)}>
          Billing
        </Link>
      ) : null}
      {signedIn || admin ? (
        <Link href="/account" className={navClass(undefined, onAccount)}>
          Sign out
        </Link>
      ) : (
        <>
          <Link href="/account" className={navClass(undefined, onAccount)}>
            Account
          </Link>
          <Link href="/buy" className="nav-item">
            Buy
          </Link>
        </>
      )}
      {tail}
    </nav>
  );
}

export function SiteHeader({
  right,
  signedIn,
  admin,
  purchaser,
  extra,
  tail,
  showPricing,
}: {
  right?: ReactNode;
  signedIn?: boolean;
  admin?: boolean;
  purchaser?: boolean;
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
          purchaser={purchaser}
          extra={extra}
          tail={tail}
          showPricing={showPricing}
        />
      )}
    </header>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-muted">{children}</p>;
}
