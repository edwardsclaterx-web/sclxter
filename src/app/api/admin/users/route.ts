import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { purgeListedOwner } from "@/lib/free-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  try {
    const result = await purgeListedOwner(body.email || "");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not remove that account." },
      { status },
    );
  }
}
