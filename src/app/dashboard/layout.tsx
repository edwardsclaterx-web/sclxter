import { redirect } from "next/navigation";
import { isAdmin, showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { DashHeader } from "./dash-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const admin = isAdmin(user);
  const purchaser = await showBillingNav(user);
  return (
    <div className="flex min-h-full flex-col">
      <DashHeader admin={admin} purchaser={purchaser} />
      {children}
    </div>
  );
}
