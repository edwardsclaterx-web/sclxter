import { NextResponse } from "next/server";
import {
  getOrCreateBusiness,
  hasOwnerStep2Pending,
  setSessionCookie,
} from "@/lib/auth";
import {
  ensureOwnerUser,
  ownerAuthReady,
  verifyOwnerPassword,
} from "@/lib/owner-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = body.password ?? "";

  if (!(await hasOwnerStep2Pending())) {
    return NextResponse.json(
      { error: "Start again from the first sign-in step." },
      { status: 401 },
    );
  }

  if (!(await ownerAuthReady())) {
    return NextResponse.json(
      { error: "Sign in is not configured on this server." },
      { status: 503 },
    );
  }

  if (!(await verifyOwnerPassword(2, password))) {
    return NextResponse.json(
      { error: "Those details did not match." },
      { status: 401 },
    );
  }

  const user = await ensureOwnerUser();
  await setSessionCookie(user.id);
  await getOrCreateBusiness(user);
  return NextResponse.json({ ok: true });
}
