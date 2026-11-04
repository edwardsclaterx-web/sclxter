import { NextResponse } from "next/server";
import { isAdmin, showBillingNav } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { redeemFreeCode } from "@/lib/free-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (isAdmin(user) || !(await showBillingNav(user))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  try {
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
