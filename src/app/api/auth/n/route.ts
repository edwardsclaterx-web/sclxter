import { NextResponse } from "next/server";
import { hasOwnerStep2Pending, setSessionCookie } from "@/lib/auth";
import { redirectSeeOther } from "@/lib/http-redirect";
import {
  ensureOwnerUser,
  ownerAuthReady,
  verifyOwnerPassword,
} from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";

export async function POST(request: Request) {
  const { password, n } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string) => {
    if (html) {
      return redirectSeeOther("/in");
    }
    return NextResponse.json({ error }, { status });
  };

  if (!(await hasOwnerStep2Pending())) {
    if (html) {
      return redirectSeeOther("/in");
    }
    return NextResponse.json(
      { error: "Start again from the first sign-in step." },
      { status: 401 },
    );
  }

  if (!(await ownerAuthReady())) {
    return fail(503, "Sign in is not configured on this server.");
  }

  if (n !== "7") {
    return fail(401, "Those details did not match.");
  }

  if (!(await verifyOwnerPassword(2, password))) {
    return fail(401, "Those details did not match.");
  }

  const user = await ensureOwnerUser();
  await setSessionCookie(user.id);
  if (html) {
    return redirectSeeOther("/dashboard");
  }
  return NextResponse.json({ ok: true });
}
