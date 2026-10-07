import type { ReactNode } from "react";
import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-sm tracking-[0.28em]">
      sclxter
    </Link>
  );
}

export function ProductNav({
  signedIn,
  extra,
  showPricing = true,
  showBuy = true,
}: {
  signedIn?: boolean;
  extra?: ReactNode;
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  return (
    <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm text-muted">
      {showPricing && <Link href="/#pricing">Pricing</Link>}
      <Link href="/demo">Demo</Link>
      <Link href="/faq">FAQ</Link>
      <Link href="/contact">Contact</Link>
      {extra}
      {signedIn ? (
        <Link href="/dashboard" className="text-fg">
          Dashboard
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
    </nav>
  );
}

export function SiteHeader({
  right,
  signedIn,
  showPricing,
  showBuy,
}: {
  right?: ReactNode;
  signedIn?: boolean;
  lowercase?: boolean;
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Wordmark />
      {right ?? (
        <ProductNav
          signedIn={signedIn}
          showPricing={showPricing}
          showBuy={showBuy}
        />
      )}
    </header>
  );
}

export function SiteFooter({
  showPricing = true,
}: {
  lowercase?: boolean;
  showPricing?: boolean;
}) {
  return (
    <footer className="border-t border-line px-5 py-5 text-xs text-muted md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>sclxter</span>
        <span className="flex gap-5">
          {showPricing && <Link href="/#pricing">Pricing</Link>}
          <Link href="/demo">Demo</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </span>
      </div>
    </footer>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-muted">{children}</p>;
}
