import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  const owned = Boolean(user && !isAdmin(user));
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="relative">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 md:px-8 md:py-28">
            <p className="text-xs tracking-[0.22em] text-muted">sclxter</p>
            <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-6xl">
              The most advanced
              <br />
              AI assistant
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
          <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 grid-cols-[minmax(0,calc(50%-24rem))_48rem_minmax(0,1fr)] grid-rows-[auto_auto] lg:grid">
            <aside className="flex items-end justify-center px-3">
              <img
                src="/hero-figure.png"
                alt=""
                width={80}
                height={100}
                className="h-24 w-auto max-w-full lg:h-[7.5rem]"
              />
            </aside>
            <div aria-hidden />
            <aside className="flex items-end pl-[5.5rem]">
              <img
                src="/hero-speed.png"
                alt=""
                width={120}
                height={80}
                className="h-[4.16rem] w-auto lg:h-[4.94rem]"
              />
            </aside>
            <p className="mt-3 min-h-16 max-w-[8.5rem] justify-self-center text-center font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
              ChatGPT level performance
            </p>
            <div aria-hidden />
            <p className="mt-3 min-h-16 pl-[5.5rem] font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
              efficient processing,
              <br />
              <span className="whitespace-nowrap">advanced conversations</span>
            </p>
          </div>
          <div className="grid grid-cols-2 items-end gap-x-6 gap-y-3 px-5 pb-12 lg:hidden">
            <div className="flex items-end justify-center">
              <img
                src="/hero-figure.png"
                alt=""
                width={80}
                height={100}
                className="h-24 w-auto"
              />
            </div>
            <div className="flex items-end justify-center">
              <img
                src="/hero-speed.png"
                alt=""
                width={120}
                height={80}
                className="h-[4.16rem] w-auto"
              />
            </div>
            <p className="max-w-[8.5rem] justify-self-center text-center font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
              ChatGPT level performance
            </p>
            <p className="justify-self-center text-center font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
              efficient processing,
              <br />
              <span className="whitespace-nowrap">advanced conversations</span>
            </p>
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
              {owned ? (
                <p className="mt-8 font-sans text-sm font-medium text-[#22c55e]">
                  Owned
                </p>
              ) : user ? null : (
                <Link
                  href="/buy"
                  className="mt-8 inline-flex h-10 items-center bg-accent px-4 text-sm text-accent-fg"
                >
                  Buy
                </Link>
              )}
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
