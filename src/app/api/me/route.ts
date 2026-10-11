import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { isAdmin, showBillingNav } from "@/lib/access";
import { userHasLiveAccess } from "@/lib/billing";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: publicUser(user),
    admin: isAdmin(user),
    purchaser: await showBillingNav(user),
    paidUntil: user.paidUntil ?? null,
    live: userHasLiveAccess(user),
  });
}
