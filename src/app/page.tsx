import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-5 py-20 md:px-8 md:py-28">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            SCLXTER
          </p>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-6xl">
            The most advanced AI assistant for independent businesses.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted">
            A script on your site. It learns your pages and the notes you type,
            then answers visitors in plain language — hours, prices, how you
            take work. Nothing else.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="inline-flex h-11 items-center bg-accent px-5 text-sm text-accent-fg"
            >
              {user ? "Open dashboard" : "Buy SCLXTER"}
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex h-11 items-center border border-line px-5 text-sm"
            >
              See pricing
            </Link>
          </div>
        </section>

        <section
          id="pricing"
          className="border-t border-line px-5 py-16 md:px-8 md:py-20"
        >
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Pricing
            </p>
            <h2 className="mt-4 text-2xl font-medium tracking-tight">
              Two levels. Card payments later.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Figures below are placeholders. Stripe is not wired yet — create
              an account to try the product.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="border border-line p-6">
                <h3 className="text-sm tracking-[0.16em] uppercase text-muted">
                  Independent
                </h3>
                <p className="mt-4 text-3xl font-medium tracking-tight">
                  £29
                  <span className="text-sm font-normal text-muted"> / month</span>
                </p>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Barbers, cafes, and small shops. One site, scan, notes, and
                  the widget.
                </p>
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="mt-8 inline-flex h-10 items-center bg-accent px-4 text-sm text-accent-fg"
                >
                  {user ? "Dashboard" : "Start"}
                </Link>
              </article>
              <article className="border border-line p-6">
                <h3 className="text-sm tracking-[0.16em] uppercase text-muted">
                  Trade
                </h3>
                <p className="mt-4 text-3xl font-medium tracking-tight">
                  £89
                  <span className="text-sm font-normal text-muted"> / month</span>
                </p>
                <p className="mt-4 text-sm leading-6 text-muted">
                  For businesses that can pay more. Same product today; higher
                  plan when we turn on billing.
                </p>
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="mt-8 inline-flex h-10 items-center border border-line px-4 text-sm"
                >
                  {user ? "Dashboard" : "Start"}
                </Link>
              </article>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
