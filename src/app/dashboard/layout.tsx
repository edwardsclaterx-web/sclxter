import { redirect } from "next/navigation";
import {
  isAdmin,
  showBillingNav,
  userCanOpenOwnerApp,
  userCoverLapsed,
} from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { LapsedCoverOverlay } from "@/components/lapsed-cover";
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
  if (!userCanOpenOwnerApp(user)) redirect("/account");
  const admin = isAdmin(user);
  const purchaser = await showBillingNav(user);
  const lapsed = userCoverLapsed(user);
  return (
    <UnsavedGuard>
      <div className="flex min-h-full min-w-0 max-w-full flex-col">
        <DashHeader admin={admin} purchaser={purchaser} />
        <div className="relative min-h-0 min-w-0 flex-1">
          <div
            className={lapsed ? "pointer-events-none select-none" : undefined}
            inert={lapsed || undefined}
            aria-hidden={lapsed || undefined}
            style={
              lapsed
                ? { filter: "blur(8px) grayscale(1)", opacity: 0.55 }
                : undefined
            }
          >
            {children}
          </div>
          {lapsed ? <LapsedCoverOverlay /> : null}
        </div>
      </div>
    </UnsavedGuard>
  );
}
