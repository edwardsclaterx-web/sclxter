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
            for independent businesses
          </p>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-6xl">
            The most advanced AI assistant
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted">
            A mini software on your site. It learns your website and the
            information you have, then interacts with customers - times, prices
            and more. It&apos;s that simple.
          </p>
          <p className="mt-8 text-sm leading-6 text-muted">
            Setup £299.99, then £74.99 a month. One plan.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
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
              One plan.
            </h2>
            <article className="mt-10 max-w-md border border-line p-6">
              <p className="text-sm tracking-[0.16em] uppercase text-muted">
                SCLXTER
              </p>
              <p className="mt-6 text-3xl font-medium tracking-tight">
                £299.99
                <span className="text-sm font-normal text-muted"> setup</span>
              </p>
              <p className="mt-2 text-3xl font-medium tracking-tight">
                £74.99
                <span className="text-sm font-normal text-muted"> a month</span>
              </p>
              <p className="mt-4 text-sm leading-6 text-muted">
                One site, scan, notes, and the widget. Card payments come later
                — create an account to try it now.
              </p>
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="mt-8 inline-flex h-10 items-center bg-accent px-4 text-sm text-accent-fg"
              >
                {user ? "Dashboard" : "Buy"}
              </Link>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
