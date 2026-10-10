import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { DashHeader } from "./dash-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-full flex-col">
      <DashHeader email={user.email} admin={isAdmin(user)} />
      {children}
    </div>
  );
}
