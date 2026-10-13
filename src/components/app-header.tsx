import { isAdmin, showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "./chrome";

export async function AppHeader({
  showPricing = false,
}: {
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  const user = await getSessionUser();
  const admin = Boolean(user && isAdmin(user));
  const purchaser = user ? await showBillingNav(user) : false;
  return (
    <SiteHeader
      signedIn={Boolean(user)}
      admin={admin}
      purchaser={purchaser}
      showPricing={showPricing}
    />
  );
}
