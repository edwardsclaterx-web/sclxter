import Link from "next/link";
import { BarberFooter, BarberHeader } from "./barber-chrome";
import { cuts } from "./cuts-data";

export const metadata = {
  title: "Northgate Barbers",
  description: "Independent barber on Northgate, York. Walk-in weekdays.",
};

export default function DemoHome() {
  return (
    <div className="flex min-h-full flex-col">
      <BarberHeader />
      <main className="flex flex-1 flex-col">
        <section className="relative">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              York · two chairs
            </p>
            <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Cuts that sit right.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              Northgate Barbers is a small independent shop at 14 Northgate, York.
              Skin fades, classic cuts, beards. Weekdays are walk-in. Saturday
              mornings we hold times on the phone. Use Ask anything at the
              bottom if you want hours or a price.
            </p>
            <div className="mt-10">
              <Link
                href="/demo/about"
                className="inline-flex h-11 items-center border border-line px-5 text-sm"
              >
                More information
              </Link>
            </div>
          </div>
          <aside className="pointer-events-none absolute top-1/2 left-0 hidden w-[calc(50%-24rem)] -translate-y-1/2 justify-center px-3 lg:flex">
            <div className="flex flex-col items-center text-center">
              <img
                src="/demo-scissors.png"
                alt=""
                width={120}
                height={120}
                className="h-16 w-auto lg:h-20"
              />
              <p className="mt-3 max-w-[9.5rem] font-sans text-[11px] font-bold leading-4 text-fg">
                skilled barbers performing their wonders
              </p>
            </div>
          </aside>
          <aside className="pointer-events-none absolute top-1/2 left-[calc(50%+24rem+5.5rem)] hidden -translate-y-1/2 lg:flex">
            <div className="flex flex-col items-center text-center">
              <img
                src="/demo-figure.png"
                alt=""
                width={80}
                height={120}
                className="h-24 w-auto lg:h-[7.5rem]"
              />
              <p className="mt-3 max-w-[8.5rem] font-sans text-[11px] font-bold leading-4 text-fg">
                elevating your appearance
              </p>
            </div>
          </aside>
        </section>
        <section className="flex-1 border-t border-line">
          <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
            <h2 className="text-sm tracking-[0.16em] text-muted">
              Cuts and prices
            </h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {cuts.map((cut) => (
                <li
                  key={cut.name}
                  className="flex items-baseline justify-between gap-6 py-5"
                >
                  <div>
                    <p>{cut.name}</p>
                    <p className="mt-1 text-sm text-muted">{cut.note}</p>
                  </div>
                  <p className="text-sm">{cut.price}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <BarberFooter />
    </div>
  );
}
