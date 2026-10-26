import { redirect } from "next/navigation";
import { showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { applyPaidCheckoutSession } from "@/lib/stripe-checkout";

export const dynamic = "force-dynamic";

export default async function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!(await showBillingNav(user))) redirect("/");
  const q = await searchParams;
  const sessionId = typeof q.session_id === "string" ? q.session_id : "";
  if (!sessionId) redirect("/billing");
  const result = await applyPaidCheckoutSession(sessionId, user.id);
  if (result.ok && ((result.applied && result.applied > 0) || result.already)) {
    redirect("/billing?paid=1");
  }
  redirect("/billing?error=1");
}
