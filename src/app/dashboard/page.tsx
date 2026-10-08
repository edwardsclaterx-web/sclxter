import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOwnedBusiness, isAdmin } from "@/lib/access";
import { readStore } from "@/lib/store";
import { toClientBusiness } from "@/lib/access";
import { BusinessScreen } from "./business-screen";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (isAdmin(user)) redirect("/dashboard/businesses");

  const biz = await getOwnedBusiness(user);
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
  const conversations = data.conversations
    .filter((c) => c.businessId === biz.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const leads = data.leads
    .filter((l) => l.businessId === biz.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <BusinessScreen
      admin={false}
      business={toClientBusiness(biz, { admin: false })}
      conversations={conversations.map((c) => ({
        seq: c.seq,
        lead: c.lead,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
        messages: c.messages,
      }))}
      leads={leads.map((l) => ({
        createdAt: l.createdAt,
        message: l.message,
      }))}
    />
  );
}
