import { BarberFooter, BarberHeader } from "../barber-chrome";
import { cuts } from "../cuts-data";

export const metadata = { title: "Cuts — Northgate Barbers" };

export default function CutsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <BarberHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 md:px-8">
        <h1 className="text-3xl font-medium tracking-tight">Cuts and prices</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          Cash and cards. Prices include a short consultation. Last cut starts
          20 minutes before close.
        </p>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {cuts.map((cut) => (
            <li key={cut.name} className="flex items-baseline justify-between gap-6 py-5">
              <div>
                <p>{cut.name}</p>
                <p className="mt-1 text-sm text-muted">{cut.note}</p>
              </div>
              <p className="text-sm">{cut.price}</p>
            </li>
          ))}
        </ul>
      </main>
      <BarberFooter />
    </div>
  );
}
