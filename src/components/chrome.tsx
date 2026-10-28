"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
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

function ProductNavLinks({
  signedIn,
  admin,
  purchaser,
  extra,
  tail,
  showPricing = true,
  stacked,
  onNavigate,
}: {
  signedIn?: boolean;
  admin?: boolean;
  purchaser?: boolean;
  extra?: ReactNode;
  tail?: ReactNode;
  showPricing?: boolean;
  stacked?: boolean;
  onNavigate?: () => void;
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
  const wrap = stacked ? "flex flex-col items-end gap-5 text-sm text-muted" : undefined;

  return (
    <nav
      className={
        wrap ||
        "flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2 text-sm text-muted"
      }
      onClick={(e) => {
        if (!onNavigate) return;
        const t = e.target as HTMLElement | null;
        if (t?.closest("a")) onNavigate();
      }}
    >
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = {
    signedIn,
    admin,
    purchaser,
    extra,
    tail,
    showPricing,
  };

  return (
    <>
      <div className="hidden md:block">
        <ProductNavLinks {...links} />
      </div>
      <button
        type="button"
        className="relative z-20 flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-menu-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="block h-[2px] w-6 bg-white" />
        <span className="block h-[2px] w-6 bg-white" />
        <span className="block h-[2px] w-6 bg-white" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 md:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="site-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-50 flex w-[60vw] flex-col bg-bg px-6 py-5 shadow-[-28px_0_48px_rgba(0,0,0,0.55)] md:hidden"
          >
            <div className="flex items-center justify-between">
              <p id={titleId} className="text-xs tracking-[0.22em] text-muted">
                menu
              </p>
              <button
                type="button"
                className="text-sm text-fg"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-8">
              <ProductNavLinks {...links} stacked onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </>
      ) : null}
    </>
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
