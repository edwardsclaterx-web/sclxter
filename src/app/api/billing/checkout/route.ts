import { NextResponse } from "next/server";
import { showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { createCoverCheckout, checkoutReady } from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (!(await showBillingNav(user))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!checkoutReady()) {
    return NextResponse.json(
      { error: "Card payments are not configured on this server." },
      { status: 503 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as { months?: number };
  try {
    const { url } = await createCoverCheckout(user, body.months ?? 0, request);
    return NextResponse.json({ url });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 500;
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status });
  }
}
