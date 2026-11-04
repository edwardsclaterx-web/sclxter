import { redirect } from "next/navigation";
import { isAdmin, showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { DashHeader } from "./dash-header";
import { UnsavedGuard } from "./unsaved-guard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  const admin = isAdmin(user);
  const purchaser = await showBillingNav(user);
  return (
    <UnsavedGuard>
      <div className="flex min-h-full min-w-0 max-w-full flex-col">
        <DashHeader admin={admin} purchaser={purchaser} />
        {children}
      </div>
    </UnsavedGuard>
  );
}
