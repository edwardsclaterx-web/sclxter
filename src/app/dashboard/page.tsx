import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOwnedBusiness, isAdmin } from "@/lib/access";
import { userHasLiveAccess } from "@/lib/billing";
import { readStore } from "@/lib/store";
import { toClientBusiness } from "@/lib/access";
import { normalizeInstructions } from "@/lib/instructions";
import { BusinessScreen } from "./business-screen";
import { ClientGo } from "./client-go";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (isAdmin(user)) {
    return <ClientGo href="/dashboard/businesses" />;
  }

  let biz = await getOwnedBusiness(user);
  if (!biz) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Your business</h1>
        <p className="mt-3 text-sm text-muted">
          No business is on this account yet.
        </p>
      </main>
    );
  }

  const data = await readStore();

  return (
    <BusinessScreen
      admin={false}
      business={toClientBusiness(biz, { admin: false })}
      instructions={normalizeInstructions(data.settings?.instructions)}
      live={userHasLiveAccess(user)}
    />
  );
}
