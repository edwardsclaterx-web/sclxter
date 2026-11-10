import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getOwnedBusiness, isAdmin, userIsActive } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { MONTH_MS, monthsPurchasable, userHasLiveAccess } from "@/lib/billing";
import { checkoutReady } from "@/lib/stripe-checkout";
import { BillingPanel } from "@/app/billing/billing-panel";
import { PurchaseSuccess } from "./purchase-success";

export const metadata = { title: "Buy — sclxter" };

function monthsFromUntil(paidUntil: string | null, hinted: number) {
  if (hinted >= 1 && hinted <= 12) return hinted;
  if (!paidUntil) return 1;
  const left = Date.parse(paidUntil) - Date.now();
  if (!Number.isFinite(left) || left <= 0) return 1;
  return Math.min(12, Math.max(1, Math.round(left / MONTH_MS)));
}

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<{
    paid?: string;
    months?: string;
    error?: string;
    cancelled?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (user && isAdmin(user)) redirect("/dashboard/businesses");

  if (!user) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader signedIn={false} showPricing={false} />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
          <h1 className="text-2xl font-medium tracking-tight">Buy</h1>
          <p className="mt-6 text-base leading-7 text-fg">
            Sign in or create an account first.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted">
            £100.00 setup, then £74.99 a month. One site, one assistant, Scan
            website, and the Ask anything widget. A free code covers setup for
            good; after the free months you only pay £74.99 a month.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted">
            After you create an account, pay here or on Billing. If you have a
            free code, sign in and enter it next to pay. If you stop paying,
            your shop data stays. The live assistant on your website switches
            off until cover is current.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/account#signin"
              className="inline-flex h-10 items-center justify-center bg-accent px-4 text-sm text-accent-fg"
            >
              Sign in
            </Link>
            <Link
              href="/account#signup"
              className="inline-flex h-10 items-center justify-center border border-line px-4 text-sm text-fg"
            >
              Create an account
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const q = await searchParams;
  const bought = q.paid === "1" && userIsActive(user);
  if (userIsActive(user) && !bought) {
    const next = new URLSearchParams();
    if (q.cancelled) next.set("cancelled", "1");
    if (q.error) next.set("error", "1");
    const qs = next.toString();
    redirect(qs ? `/billing?${qs}` : "/billing");
  }
  const shop = bought ? await getOwnedBusiness(user) : null;
  const months = monthsFromUntil(
    user.paidUntil ?? null,
    Number(q.months || 0),
  );

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        {bought ? (
          <PurchaseSuccess
            email={user.email}
            businessName={shop?.name}
            months={months}
            paidUntil={user.paidUntil ?? null}
          />
        ) : (
          <>
            <h1 className="text-2xl font-medium tracking-tight">Buy</h1>
            <BillingPanel
              paidUntil={user.paidUntil ?? null}
              live={userHasLiveAccess(user)}
              setupPaid={user.setupPaid === true}
              maxMonths={monthsPurchasable(user.paidUntil)}
              checkoutReady={checkoutReady()}
              notice={
                q.cancelled
                  ? "Checkout was cancelled. Nothing was charged."
                  : q.error
                    ? "That payment could not be confirmed. If you were charged, wait a moment and refresh."
                    : null
              }
            />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
