import Link from "next/link";

export function BarberHeader({
  showCuts = true,
}: {
  showCuts?: boolean;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Link href="/demo" className="text-sm tracking-[0.22em]">
        NORTHGATE
      </Link>
      <nav className="flex gap-6 text-sm text-muted">
        {showCuts ? <Link href="/demo/cuts">Cuts</Link> : null}
        <Link href="/demo/about">About</Link>
        <Link href="/" className="hidden sm:inline">
          sclxter
        </Link>
      </nav>
    </header>
  );
}

export function BarberFooter() {
  return (
    <footer className="border-t border-line px-5 py-5 text-xs text-muted md:px-10">
      Northgate Barbers · 14 Northgate, York YO1 7HH · 01904 555 018 · Ask
      anything on the tab
    </footer>
  );
}
