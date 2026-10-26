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
import { isNorthgateLogin } from "@/lib/northgate";
import { loadSecrets } from "@/lib/secrets";
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
  loadSecrets();
  const { email, password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fromIn = postedFromIn(request);
  const fail = (status: number, error: string) => {
    if (html) {
      return redirectSeeOther(fromIn ? "/in?error=1" : "/account?error=1");
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
    const res = html
      ? redirectSeeOther("/in")
      : NextResponse.json({ ok: true, next: "in" });
    await setOwnerStep2Cookie(res, request);
    return res;
  }

  if (isNorthgateLogin(mail)) {
    if (!(await verifyOwnerPassword(1, password))) {
      return fail(401, "Those details did not match.");
    }
    const northgate = (await readStore()).users.find((u) =>
      isNorthgateLogin(u.email),
    );
    if (!northgate) {
      return fail(401, "Those details did not match.");
    }
    const res = html
      ? redirectSeeOther("/dashboard")
      : NextResponse.json({ ok: true });
    await setSessionCookie(northgate.id, res, request);
    return res;
  }

  const existing = (await readStore()).users.find((u) => u.email === mail);
  if (!existing || !(await checkPassword(password, existing.passwordHash))) {
    return fail(401, "Those details did not match.");
  }
  const res = html
    ? redirectSeeOther("/dashboard")
    : NextResponse.json({ ok: true });
  await setSessionCookie(existing.id, res, request);
  return res;
}
