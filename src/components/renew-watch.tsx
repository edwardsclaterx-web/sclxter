import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { inRenewWarningWindow } from "@/lib/cover";
import { RenewWarning } from "./renew-warning";

export async function RenewWatch() {
  const user = await getSessionUser();
  if (!user || isAdmin(user) || !user.paidUntil) return null;
  if (!inRenewWarningWindow(user.paidUntil)) return null;
  return <RenewWarning paidUntil={user.paidUntil} />;
}
