import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        signedIn={Boolean(user)}
        lowercase
        showPricing={false}
        showBuy={false}
      />
      <main className="flex-1">
        <section className="relative">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 md:px-8 md:py-28">
            <p className="text-xs tracking-[0.22em] text-muted">sclxter</p>
            <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-6xl">
              The most advanced AI assistant
            </h1>
            <p className="mt-3 text-sm text-muted">for independent businesses</p>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              An AI on your site. It learns your website and the information you
              have, then interacts with customers - times, prices and more.
              It&apos;s that simple.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex h-11 items-center bg-accent px-5 text-sm text-accent-fg"
              >
                View Demo
              </Link>
              <Link
                href="/faq"
                className="inline-flex h-11 items-center bg-accent px-5 text-sm text-accent-fg"
              >
                View FAQ
              </Link>
            </div>
          </div>
          <aside className="pointer-events-none absolute top-1/2 left-0 hidden w-[calc(50%-24rem)] -translate-y-1/2 justify-center px-3 lg:flex">
            <div className="flex flex-col items-center text-center">
              <img
                src="/hero-figure.png"
                alt=""
                width={80}
                height={100}
                className="h-16 w-auto lg:h-20"
              />
              <p className="mt-3 max-w-[8.5rem] font-sans text-[11px] font-bold leading-4 text-fg">
                ChatGPT level performance
              </p>
            </div>
          </aside>
          <aside className="pointer-events-none absolute top-1/2 left-[calc(50%+24rem+5.5rem)] hidden -translate-y-1/2 lg:flex">
            <div className="flex flex-col items-center text-center">
              <img
                src="/hero-speed.png"
                alt=""
                width={120}
                height={80}
                className="h-16 w-auto lg:h-[4.75rem]"
              />
              <p className="mt-3 max-w-[9.5rem] font-sans text-[11px] font-bold leading-4 text-fg">
                efficient processing and advanced conversations
              </p>
            </div>
          </aside>
          <div className="flex justify-around gap-6 px-5 pb-12 lg:hidden">
            <div className="flex flex-col items-center text-center">
              <img
                src="/hero-figure.png"
                alt=""
                width={80}
                height={100}
                className="h-16 w-auto"
              />
              <p className="mt-3 max-w-[8.5rem] font-sans text-[11px] font-bold leading-4 text-fg">
                ChatGPT level performance
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img
                src="/hero-speed.png"
                alt=""
                width={120}
                height={80}
                className="h-16 w-auto"
              />
              <p className="mt-3 max-w-[9.5rem] font-sans text-[11px] font-bold leading-4 text-fg">
                efficient processing and advanced conversations
              </p>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="border-t border-line px-5 py-16 md:px-8 md:py-20"
        >
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-xs tracking-[0.22em] text-muted">pricing</p>
            <h2 className="mt-4 text-2xl font-medium tracking-tight">
              One plan.
            </h2>
            <article className="mt-10 max-w-md border border-line p-6">
              <p className="text-sm tracking-[0.16em] text-muted">sclxter</p>
              <p className="mt-6 text-3xl font-medium tracking-tight">
                £299.99
                <span className="text-sm font-normal text-muted"> setup</span>
              </p>
              <p className="mt-2 text-3xl font-medium tracking-tight">
                £74.99
                <span className="text-sm font-normal text-muted"> a month</span>
              </p>
              <p className="mt-4 text-sm leading-6 text-muted">
                One site, one assistant, and an increase in customers.
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
      <SiteFooter lowercase showPricing={false} />
    </div>
  );
}
