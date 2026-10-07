import Link from "next/link";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <>
            <Link href="/demo">Barber demo</Link>
            {user ? (
              <Link href="/dashboard" className="text-fg">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/signup" className="text-fg">
                  Start
                </Link>
              </>
            )}
          </>
        }
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-20 md:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">
          For independents
        </p>
        <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-5xl">
          An assistant that only knows your shop.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted">
          SCLXTER is a small script for your website. It reads your public
          pages, plus notes you type — hours, prices, how you take bookings —
          and answers visitors in plain language. Nothing else.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="inline-flex h-11 items-center bg-accent px-5 text-sm text-accent-fg"
          >
            {user ? "Open dashboard" : "Create an account"}
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center border border-line px-5 text-sm"
          >
            See it on a barber shop
          </Link>
        </div>
      </main>
      <footer className="border-t border-line px-5 py-5 text-xs text-muted md:px-10">
        Trial uses a server-side language model. No card required.
      </footer>
    </div>
  );
}
