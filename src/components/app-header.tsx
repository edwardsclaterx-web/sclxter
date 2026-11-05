import { isAdmin, showBillingNav, userCanOpenOwnerApp } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "./chrome";

export async function AppHeader({
  showPricing = false,
}: {
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  const user = await getSessionUser();
  const signedIn = Boolean(user && userCanOpenOwnerApp(user));
  const admin = Boolean(user && isAdmin(user));
  const purchaser = user && signedIn ? await showBillingNav(user) : false;
  return (
    <SiteHeader
      signedIn={signedIn}
      admin={admin}
      purchaser={purchaser}
      showPricing={showPricing}
    />
  );
}
