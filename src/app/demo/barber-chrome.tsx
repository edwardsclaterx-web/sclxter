import Link from "next/link";

export function BarberHeader() {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Link href="/demo" className="text-sm tracking-[0.22em]">
        NORTHGATE
      </Link>
    </header>
  );
}

export function BarberFooter() {
  return (
    <footer className="border-t border-line px-5 py-5 text-xs text-muted md:px-10">
      <p>Northgate Barbers · 14 Northgate, York YO1 7HH · 01904 555 018</p>
      <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/demo/cuts">Cuts</Link>
        <Link href="/demo/about">About</Link>
        <Link href="/demo/about">More information</Link>
      </nav>
    </footer>
  );
}
