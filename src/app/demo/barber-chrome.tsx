import Link from "next/link";
import { AppHeader } from "@/components/app-header";

export async function BarberHeader() {
  return (
    <div>
      <AppHeader />
      <p className="px-5 pt-4 text-sm tracking-[0.22em] md:px-10">NORTHGATE</p>
    </div>
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
