import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/access";
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
  if (isAdmin(user)) redirect("/");
  const q = await searchParams;
  const sessionId = typeof q.session_id === "string" ? q.session_id : "";
  if (!sessionId) redirect("/buy");
  const result = await applyPaidCheckoutSession(sessionId, user.id);
  if (result.ok && ((result.applied && result.applied > 0) || result.already)) {
    const months = result.applied || result.months || 0;
    const q = months >= 1 ? `?paid=1&months=${months}` : "?paid=1";
    redirect(`/buy${q}`);
  }
  redirect("/buy?error=1");
}
