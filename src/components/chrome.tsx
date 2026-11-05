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
  const onBuy = pathname === "/buy";
  const onMessages = pathname === "/dashboard/messages" || pathname.startsWith("/dashboard/messages/");
  const onBusinesses =
    pathname === "/dashboard/businesses" ||
    pathname.startsWith("/dashboard/businesses/");
  const billing = Boolean(purchaser) && !admin;
  const owner = Boolean(signedIn) && !admin;
  const showBuy = !admin && !signedIn;
  const wrap = stacked
    ? "flex flex-col items-stretch gap-0 font-sans text-[22px] font-medium leading-snug tracking-tight text-muted"
    : undefined;

  function item(active?: boolean) {
    if (!stacked) return navClass(undefined, active);
    return [
      "block border-b border-line py-3.5 text-[22px] font-medium tracking-tight",
      active ? "text-fg" : "text-muted",
    ].join(" ");
  }

  return (
    <nav
      className={
        wrap ||
        "flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2 text-sm text-muted"
      }
      onClick={(e) => {
        if (!onNavigate) return;
        const t = e.target as HTMLElement | null;
        if (!t?.closest("a")) return;
        window.setTimeout(onNavigate, 150);
      }}
    >
      {!admin && (
        <Link href="/" className={item(onHome)}>
          Home
        </Link>
      )}
      {owner && (
        <Link href="/dashboard" className={item(pathname === "/dashboard")}>
          My dashboard
        </Link>
      )}
      {showPricing && (
        <Link href="/#pricing" className={item()}>
          Pricing
        </Link>
      )}
      <Link href="/demo" className={item(onDemo)}>
        Demo
      </Link>
      <Link href="/faq" className={item(onFaq)}>
        FAQ
      </Link>
      <Link href="/contact" className={item(onContact)}>
        Contact
      </Link>
      {extra}
      {admin ? (
        <>
          <Link href="/dashboard/businesses" className={item(onBusinesses)}>
            Businesses
          </Link>
          <Link href="/dashboard/messages" className={item(onMessages)}>
            Messages
          </Link>
        </>
      ) : null}
      {billing ? (
        <Link href="/billing" className={item(onBilling)}>
          Billing
        </Link>
      ) : null}
      {signedIn || admin ? (
        <Link href="/account" className={item(onAccount)}>
          Sign out
        </Link>
      ) : (
        <>
          <Link href="/account" className={item(onAccount)}>
            Account
          </Link>
          {showBuy ? (
            <Link href="/buy" className={item(onBuy)}>
              Buy
            </Link>
          ) : null}
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
      <div className="hidden min-w-0 lg:block">
        <ProductNavLinks {...links} />
      </div>
      <button
        type="button"
        className="relative z-[80] flex h-10 w-10 shrink-0 items-center justify-center lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-menu-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative block h-4 w-6">
          <span
            className={`absolute left-0 block h-[2px] w-6 bg-white transition-transform duration-200 ${
              open ? "top-[7px] rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 top-[7px] block h-[2px] w-6 bg-white transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-[2px] w-6 bg-white transition-transform duration-200 ${
              open ? "top-[7px] -rotate-45" : "top-[14px]"
            }`}
          />
        </span>
      </button>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className={`fixed inset-0 z-[60] bg-black/55 lg:hidden ${open ? "" : "hidden"}`}
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />
      <div
        id="site-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed inset-y-0 right-0 z-[70] flex w-[min(18rem,78vw)] flex-col bg-bg px-6 pb-8 pt-16 shadow-[-28px_0_48px_rgba(0,0,0,0.55)] lg:hidden ${
          open ? "" : "hidden"
        }`}
      >
        <p id={titleId} className="sr-only">
          menu
        </p>
        <ProductNavLinks {...links} stacked onNavigate={() => setOpen(false)} />
      </div>
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
    <header
      className="site-bar sticky top-0 z-50 flex min-w-0 max-w-full shrink-0 items-center justify-between gap-3 border-b border-line bg-bg px-5 py-4 md:px-10"
      style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "var(--bg)" }}
    >
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

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-5 py-8 md:px-10">
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/dpa">DPA</Link>
      </nav>
    </footer>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-muted">{children}</p>;
}
