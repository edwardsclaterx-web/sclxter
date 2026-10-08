import { NextResponse } from "next/server";
import { setOwnerStep2Cookie } from "@/lib/auth";
import {
  isOwnerEmail,
  ownerAuthReady,
  verifyOwnerPassword,
} from "@/lib/owner-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!(await ownerAuthReady())) {
    return NextResponse.json(
      { error: "Sign in is not configured on this server." },
      { status: 503 },
    );
  }

  if (!isOwnerEmail(email) || !(await verifyOwnerPassword(1, password))) {
    return NextResponse.json(
      { error: "Those details did not match." },
      { status: 401 },
    );
  }

  await setOwnerStep2Cookie();
  return NextResponse.json({ ok: true, next: "second" });
}
