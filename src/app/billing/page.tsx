import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { monthsPurchasable, userHasLiveAccess } from "@/lib/billing";
import { checkoutReady } from "@/lib/stripe-checkout";
import { BillingPanel } from "./billing-panel";

export const metadata = { title: "Billing — sclxter" };
export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; cancelled?: string; error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!(await showBillingNav(user))) redirect("/");
  const q = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Billing</h1>
        <BillingPanel
          paidUntil={user.paidUntil ?? null}
          live={userHasLiveAccess(user)}
          setupPaid={user.setupPaid === true}
          maxMonths={monthsPurchasable(user.paidUntil)}
          checkoutReady={checkoutReady()}
          notice={
            q.paid
              ? "Payment received. Cover is on this account."
              : q.cancelled
                ? "Checkout was cancelled. Nothing was charged."
                : q.error
                  ? "That payment could not be confirmed. If you were charged, wait a moment and refresh."
                  : null
          }
        />
      </main>
    </div>
  );
}
