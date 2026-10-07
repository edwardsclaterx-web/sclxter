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
        <section className="mx-auto w-full max-w-3xl px-5 py-20 md:px-8 md:py-28">
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
          <div className="mt-10">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center bg-accent px-5 text-sm text-accent-fg"
            >
              view demo
            </Link>
          </div>
        </section>

        <section
          id="pricing"
          className="border-t border-line px-5 py-16 md:px-8 md:py-20"
        >
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-xs tracking-[0.22em] text-muted">sclxter</p>
            <p className="mt-6 text-3xl font-medium tracking-tight">
              £299.99
              <span className="text-sm font-normal text-muted"> setup</span>
            </p>
            <p className="mt-2 text-3xl font-medium tracking-tight">
              £74.99
              <span className="text-sm font-normal text-muted"> a month</span>
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              One plan. Card payments come later.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter lowercase showPricing={false} />
    </div>
  );
}
