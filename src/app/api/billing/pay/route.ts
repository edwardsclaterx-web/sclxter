import { NextResponse } from "next/server";
import { getOwnedBusiness, isAdmin, showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { applyPaidMonths, MAX_COVER_MONTHS } from "@/lib/billing";
import { updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (!(await showBillingNav(user))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (isAdmin(user)) {
    const shop = await getOwnedBusiness(user);
    if (!shop) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  }

  const body = (await request.json().catch(() => ({}))) as { months?: unknown };
  const months = typeof body.months === "number" ? body.months : Number(body.months);
  if (!Number.isInteger(months) || months < 1 || months > MAX_COVER_MONTHS) {
    return NextResponse.json(
      { error: "Pick between 1 and 12 months." },
      { status: 400 },
    );
  }

  const result = await updateStore((data) => {
    const row = data.users.find((u) => u.id === user.id);
    if (!row) return null;
    const next = applyPaidMonths(row.paidUntil, months);
    if (next.applied && next.paidUntil) row.paidUntil = next.paidUntil;
    return {
      applied: next.applied,
      refused: next.refused,
      paidUntil: row.paidUntil ?? null,
    };
  });

  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(result);
}
