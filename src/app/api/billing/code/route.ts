import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import {
  isStripeDiscountCode,
  readAccessCode,
  redeemFreeCode,
} from "@/lib/free-codes";
import { checkoutReady, createCoverCheckout } from "@/lib/stripe-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (isAdmin(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  try {
    const row = await readAccessCode(body.code || "");
    if (isStripeDiscountCode(row)) {
      if (!checkoutReady()) {
        return NextResponse.json(
          { error: "Card payments are not configured on this server." },
          { status: 503 },
        );
      }
      const { url } = await createCoverCheckout(user, row.months, request, {
        code: row.code,
        percentOff: 99,
      });
      return NextResponse.json({
        url,
        months: row.months,
        percentOff: 99,
      });
    }
    const result = await redeemFreeCode(user, body.code || "");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 500;
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "That code could not be applied.",
      },
      { status },
    );
  }
}
