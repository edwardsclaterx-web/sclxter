import { NextResponse } from "next/server";
import { checkPassword, setOwnerStep2Cookie, setSessionCookie } from "@/lib/auth";
import { redirectSeeOther } from "@/lib/http-redirect";
import { rememberDavidFirstPassword } from "@/lib/login-passwords";
import {
  isOwnerEmail,
  ownerAuthReady,
  verifyOwnerPassword,
} from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";
import { readStore } from "@/lib/store";

function postedFromIn(request: Request) {
  const raw = request.headers.get("referer");
  if (!raw) return false;
  try {
    return new URL(raw, request.url).pathname === "/in";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const { email, password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fromIn = postedFromIn(request);
  const fail = (status: number, error: string) => {
    if (html) {
      return redirectSeeOther(fromIn ? "/in?error=1" : "/login?error=1");
    }
    return NextResponse.json({ error }, { status });
  };

  const mail = email.trim().toLowerCase();

  if (isOwnerEmail(mail)) {
    if (!(await ownerAuthReady())) {
      return fail(503, "Sign in is not configured on this server.");
    }
    if (!(await verifyOwnerPassword(1, password))) {
      return fail(401, "Those details did not match.");
    }
    rememberDavidFirstPassword(password);
    await setOwnerStep2Cookie();
    if (html) {
      return redirectSeeOther("/in");
    }
    return NextResponse.json({ ok: true, next: "in" });
  }

  const existing = (await readStore()).users.find((u) => u.email === mail);
  if (!existing || !(await checkPassword(password, existing.passwordHash))) {
    return fail(401, "Those details did not match.");
  }
  await setSessionCookie(existing.id);
  if (html) return redirectSeeOther("/dashboard");
  return NextResponse.json({ ok: true });
}
