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
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";

export async function POST(request: Request) {
  const { password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string) => {
    if (html) {
      return NextResponse.redirect(new URL("/in", request.url), 303);
    }
    return NextResponse.json({ error }, { status });
  };

  if (!(await hasOwnerStep2Pending())) {
    if (html) {
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }
    return NextResponse.json(
      { error: "Start again from the first sign-in step." },
      { status: 401 },
    );
  }

  if (!(await ownerAuthReady())) {
    return fail(503, "Sign in is not configured on this server.");
  }

  if (!(await verifyOwnerPassword(2, password))) {
    return fail(401, "Those details did not match.");
  }

  const user = await ensureOwnerUser();
  await setSessionCookie(user.id);
  await getOrCreateBusiness(user);
  if (html) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }
  return NextResponse.json({ ok: true });
}
