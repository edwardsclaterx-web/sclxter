import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { AccountPanel } from "./account-panel";

export const metadata = { title: "Account — sclxter" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        signedIn
        admin={isAdmin(user)}
        showPricing={false}
        showBuy={false}
      />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Account</h1>
        <AccountPanel email={user.email} />
      </main>
    </div>
  );
}
