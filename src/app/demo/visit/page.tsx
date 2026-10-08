import { BarberFooter, BarberHeader } from "../barber-chrome";

export const metadata = { title: "Visit — Northgate Barbers" };

export default function VisitPage() {
  return (
    <div className="flex min-h-full flex-col">
      <BarberHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 md:px-8">
        <h1 className="text-3xl font-medium tracking-tight">Hours and booking</h1>
        <dl className="mt-10 space-y-6 text-sm leading-6">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">Hours</dt>
            <dd className="mt-2">
              Tuesday–Friday 9:00–18:00
              <br />
              Saturday 8:30–16:00
              <br />
              Sunday and Monday closed
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Walk-in or book
            </dt>
            <dd className="mt-2 text-muted">
              Weekdays are mostly walk-in. Saturday mornings fill up — call
              01904 555 018 to hold a time. We do not take bookings on this
              website. Same-day weekday waits are usually under 20 minutes
              before 4pm.
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">Find us</dt>
            <dd className="mt-2 text-muted">
              14 Northgate, York YO1 7HH. Street parking nearby. Phone 01904
              555 018.
            </dd>
          </div>
        </dl>
      </main>
      <BarberFooter />
    </div>
  );
}
