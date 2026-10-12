import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Buy — sclxter" };

export default async function BuyPage() {
  const user = await getSessionUser();
  if (user) redirect("/billing");
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={false} showPricing={false} showBuy />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Buy</h1>
        <p className="mt-6 text-base leading-7 text-fg">
          £299.99 setup, then £74.99 a month. One site, one assistant, Scan
          website, and the Ask anything widget.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted">
          Create an account first so the assistant is tied to your email. Card
          payments wait until Stripe is live — nothing is charged on this
          page.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted">
          If you stop paying, your shop data stays. The live assistant on your
          website switches off until cover is current.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="inline-flex h-10 items-center justify-center bg-accent px-4 text-sm text-accent-fg"
          >
            Account
          </Link>
        </div>
      </main>
    </div>
  );
}
