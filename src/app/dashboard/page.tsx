import { redirect } from "next/navigation";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { readStore } from "@/lib/store";
import { Dashboard } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const business = await getOrCreateBusiness(user);
  const data = await readStore();
  const notes = data.knowledge.filter(
    (k) => k.businessId === business.id && k.source === "note",
  );
  return (
    <Dashboard email={user.email} business={business} notes={notes} />
  );
}
