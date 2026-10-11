import { NextResponse } from "next/server";
import { showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (!(await showBillingNav(user))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(
    { error: "Card payments when Stripe is live." },
    { status: 403 },
  );
}
