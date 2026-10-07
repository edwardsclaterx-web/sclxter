import Link from "next/link";
import { BarberFooter, BarberHeader } from "./barber-chrome";
import { WidgetLoader } from "./widget-loader";

export const metadata = {
  title: "Northgate Barbers",
  description: "Independent barber on Northgate, York. Walk-in weekdays.",
};

export default function DemoHome() {
  return (
    <div className="flex min-h-full flex-col">
      <BarberHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 md:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">
          York · two chairs
        </p>
        <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-5xl">
          Cuts that sit right.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted">
          Northgate Barbers is a small independent shop at 14 Northgate. Skin
          fades, classic cuts, beards. Weekdays are walk-in. Saturday mornings
          we hold times on the phone.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/demo/cuts"
            className="inline-flex h-11 items-center bg-accent px-5 text-sm text-accent-fg"
          >
            Cuts and prices
          </Link>
          <Link
            href="/demo/visit"
            className="inline-flex h-11 items-center border border-line px-5 text-sm"
          >
            Hours and booking
          </Link>
        </div>
      </main>
      <BarberFooter />
      <WidgetLoader />
    </div>
  );
}
