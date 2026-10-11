import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { userHasLiveAccess } from "@/lib/billing";
import { BillingPanel } from "./billing-panel";

export const metadata = { title: "Billing — sclxter" };

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await showBillingNav(user))) redirect("/");

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Billing</h1>
        <BillingPanel
          paidUntil={user.paidUntil ?? null}
          live={userHasLiveAccess(user)}
        />
      </main>
    </div>
  );
}
