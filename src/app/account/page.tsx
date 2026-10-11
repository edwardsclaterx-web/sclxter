import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getSessionUser } from "@/lib/auth";
import { accountPasswordFor } from "@/lib/login-passwords";
import { AccountPanel } from "./account-panel";

export const metadata = { title: "Account — sclxter" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Account</h1>
        <AccountPanel email={user.email} password={accountPasswordFor(user)} />
      </main>
    </div>
  );
}
