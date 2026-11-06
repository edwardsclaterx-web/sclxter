import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import {
  createFreeCode,
  deleteUnusedFreeCode,
  listFreeCodes,
} from "@/lib/free-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) {
    return { error: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  }
  return { user };
}

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const codes = await listFreeCodes();
  return NextResponse.json({ codes });
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const body = (await request.json().catch(() => ({}))) as {
    months?: number;
    percentOff?: number;
  };
  try {
    const code = await createFreeCode(body.months ?? 0, {
      percentOff: body.percentOff,
    });
    return NextResponse.json({ code });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create that code." },
      { status },
    );
  }
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  try {
    await deleteUnusedFreeCode(body.code || "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete that code." },
      { status },
    );
  }
}
