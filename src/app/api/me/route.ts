import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { isAdmin, showBillingNav, userIsActive } from "@/lib/access";
import { userHasLiveAccess } from "@/lib/billing";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const res = NextResponse.json({
    user: publicUser(user),
    admin: isAdmin(user),
    purchaser: await showBillingNav(user),
    active: userIsActive(user),
    paidUntil: user.paidUntil ?? null,
    live: userHasLiveAccess(user),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
