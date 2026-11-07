export const metadata = {
  title: "K Barbers Emporium — preview by sclxter",
  description:
    "A sclxter preview of K Barbers Emporium in Billericay. Not their live website.",
};

const hours = [
  { day: "Monday – Friday", shop: "8.30am – 7.00pm", coffee: "9.00am – 4.00pm" },
  { day: "Saturday", shop: "7.30am – 5.00pm", coffee: "8.00am – 4.30pm" },
  { day: "Sunday", shop: "Closed", coffee: "Closed" },
];

const quotes = [
  "West End quality in Billericay.",
  "Fully employed staff, not chair renters — and everyone knows your name.",
  "Barbershop, coffee lounge and retail under one roof.",
];

export default function KBarbersDemoPage() {
  return (
    <div className="min-h-full bg-[#1a140c] text-[#f4ead4]">
      <div className="border-b border-[#c9a227] bg-[#0f0c08] px-4 py-3 text-center text-sm leading-5 md:px-8">
        <p className="font-medium tracking-wide text-[#c9a227]">
          Preview by sclxter — this is not the live K Barbers website
        </p>
        <p className="mt-1 text-[#cfc3a8]">
          Ask anything is trained on a scan of kbarbers.co.uk. No bookings or
          shop checkout here.{" "}
          <a
            href="https://sclxter.com/buy"
            className="underline decoration-[#c9a227] underline-offset-4 hover:text-[#c9a227]"
          >
            Get this on your site
          </a>
        </p>
      </div>

      <header className="border-b border-[#3a301f] px-5 py-4 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-3">
          <p className="text-lg tracking-[0.18em] uppercase">K Barbers</p>
          <p className="text-sm text-[#cfc3a8]">
            01277 652272 · 129 High Street, Billericay
          </p>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 py-16 md:px-10 md:py-24">
          <p className="text-xs uppercase tracking-[0.28em] text-[#c9a227]">
            World-class men’s barbering
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
            The K Way — often imitated… never mistaken
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#cfc3a8]">
            K Barbers Emporium on Billericay High Street: classic cuts, shaves
            and beards, a Koffee Club, and a British grooming shop. Eighteen
            years of #theKway — quality, consistency and continuity. Founder
            Kevin Vorley, British Grandmaster Barber.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="https://sclxter.com/buy"
              className="inline-flex h-11 items-center bg-[#c9a227] px-5 text-sm font-semibold text-[#1a140c]"
            >
              Get this assistant — sclxter.com/buy
            </a>
            <p className="self-center text-sm text-[#8f846c]">
              Bookings stay on their real site.
            </p>
          </div>
        </section>

        <section className="border-t border-[#3a301f] bg-[#14100a]">
          <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2 md:px-10">
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-[#c9a227]">
                Billericay hours
              </h2>
              <ul className="mt-6 divide-y divide-[#3a301f] border-y border-[#3a301f]">
                {hours.map((row) => (
                  <li key={row.day} className="py-4">
                    <p className="font-medium">{row.day}</p>
                    <p className="mt-1 text-sm text-[#cfc3a8]">
                      Shop {row.shop}
                    </p>
                    <p className="text-sm text-[#cfc3a8]">
                      Koffee Club {row.coffee}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-[#c9a227]">
                Inside the Emporium
              </h2>
              <p className="mt-6 text-base leading-7 text-[#cfc3a8]">
                Appointments and walk-ins when a chair is free. Directors Lounge
                with Kevin. Team includes James, Daniel, Mason, coordinators
                Alicia and May, and the Koffee Club baristas. Retail: K range,
                Morgans Pomade, Freshheads and Gabri tonics — browse on their
                live site, not here.
              </p>
              <ul className="mt-8 space-y-4">
                {quotes.map((q) => (
                  <li
                    key={q}
                    className="border-l-2 border-[#c9a227] pl-4 text-sm leading-6 text-[#e6dcc4]"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-14 md:px-10">
          <h2 className="text-sm uppercase tracking-[0.2em] text-[#c9a227]">
            Ask anything
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#cfc3a8]">
            Open Ask anything for hours, the team, Koffee Club, or how to get
            there. Off-topic questions stay in this shop’s world. Weather,
            football and homework are refused.
          </p>
        </section>
      </main>

      <footer className="border-t border-[#3a301f] px-5 py-8 text-sm text-[#8f846c] md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:justify-between">
          <p>Preview by sclxter · not kbarbers.co.uk</p>
          <a href="https://sclxter.com/buy" className="text-[#c9a227]">
            sclxter.com/buy
          </a>
        </div>
      </footer>
    </div>
  );
}
