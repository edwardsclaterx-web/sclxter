import { isAdmin, showBillingNav, userIsActive } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "./chrome";

export async function AppHeader({
  showPricing = false,
}: {
  showPricing?: boolean;
  showBuy?: boolean;
}) {
  const user = await getSessionUser();
  const active = Boolean(user && userIsActive(user));
  const admin = Boolean(user && isAdmin(user));
  const purchaser = user && active ? await showBillingNav(user) : false;
  return (
    <SiteHeader
      signedIn={active}
      admin={admin}
      purchaser={purchaser}
      showPricing={showPricing}
    />
  );
}
