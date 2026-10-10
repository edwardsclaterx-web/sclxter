import Link from "next/link";
import { SiteHeader } from "@/components/chrome";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        signedIn={Boolean(user)}
        admin={Boolean(user && isAdmin(user))}
        lowercase
        showPricing={false}
        showBuy={false}
      />
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
          <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-end lg:flex">
            <aside className="flex w-[calc(50%-24rem)] justify-center px-3">
              <div className="flex flex-col items-center text-center">
                <img
                  src="/hero-figure.png"
                  alt=""
                  width={80}
                  height={100}
                  className="h-24 w-auto max-w-full lg:h-[7.5rem]"
                />
                <p className="mt-3 min-h-16 max-w-[8.5rem] font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
                  ChatGPT level performance
                </p>
              </div>
            </aside>
            <div className="w-[48rem] shrink-0" aria-hidden />
            <aside className="flex flex-1 items-end pl-[5.5rem]">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 items-end justify-center lg:h-[4.75rem]">
                  <img
                    src="/hero-speed.png"
                    alt=""
                    width={120}
                    height={80}
                    className="h-[4.16rem] w-auto lg:h-[4.94rem]"
                  />
                </div>
                <p className="mt-3 min-h-16 font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
                  efficient processing,
                  <br />
                  <span className="whitespace-nowrap">advanced conversations</span>
                </p>
              </div>
            </aside>
          </div>
          <div className="flex justify-around gap-6 px-5 pb-12 lg:hidden">
            <div className="flex flex-col items-center text-center">
              <img
                src="/hero-figure.png"
                alt=""
                width={80}
                height={100}
                className="h-24 w-auto"
              />
              <p className="mt-3 max-w-[8.5rem] font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
                ChatGPT level performance
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 items-end justify-center">
                <img
                  src="/hero-speed.png"
                  alt=""
                  width={120}
                  height={80}
                  className="h-[4.16rem] w-auto"
                />
              </div>
              <p className="mt-3 font-sans text-[13.2px] font-bold leading-[1.2rem] text-fg">
                efficient processing,
                <br />
                <span className="whitespace-nowrap">advanced conversations</span>
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
              {user ? (
                <p className="mt-8 font-sans text-sm font-medium text-[#22c55e]">
                  Owned
                </p>
              ) : (
                <Link
                  href="/signup"
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
