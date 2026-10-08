import { NextResponse } from "next/server";
import { setOwnerStep2Cookie } from "@/lib/auth";
import { redirectSeeOther } from "@/lib/http-redirect";
import {
  isOwnerEmail,
  ownerAuthReady,
  verifyOwnerPassword,
} from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";

export async function POST(request: Request) {
  const { email, password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string) => {
    if (html) {
      return redirectSeeOther("/login");
    }
    return NextResponse.json({ error }, { status });
  };

  if (!(await ownerAuthReady())) {
    return fail(503, "Sign in is not configured on this server.");
  }

  const mail = email.trim().toLowerCase();
  if (!isOwnerEmail(mail) || !(await verifyOwnerPassword(1, password))) {
    return fail(401, "Those details did not match.");
  }

  await setOwnerStep2Cookie();
  if (html) {
    return redirectSeeOther("/in");
  }
  return NextResponse.json({ ok: true, next: "in" });
}
