import type { ReactNode } from "react";
import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-sm tracking-[0.28em]">
      SCLXTER
    </Link>
  );
}

export function SiteHeader({
  right,
}: {
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Wordmark />
      <nav className="flex items-center gap-6 text-sm text-muted">{right}</nav>
    </header>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-muted">{children}</p>;
}
