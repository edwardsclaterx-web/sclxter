import { NextResponse } from "next/server";
import { checkPassword, setSessionCookie } from "@/lib/auth";
import { redirectSeeOther } from "@/lib/http-redirect";
import {
  ensureOwnerUser,
  isOwnerEmail,
  ownerAuthReady,
  verifyOwnerPassword,
} from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";
import {
  isLeavesakeLogin,
  verifyLeavesakePassword,
} from "@/lib/leavesake";
import { isNorthgateLogin } from "@/lib/northgate";
import { loadSecrets } from "@/lib/secrets";
import { readStore } from "@/lib/store";

export async function POST(request: Request) {
  loadSecrets();
  const { email, password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string) => {
    if (html) {
      return redirectSeeOther("/account?error=1");
    }
    return NextResponse.json({ error }, { status });
  };

  const mail = email.trim().toLowerCase();

  if (isOwnerEmail(mail)) {
    if (!(await ownerAuthReady())) {
      return fail(503, "Sign in is not configured on this server.");
    }
    if (!(await verifyOwnerPassword(password))) {
      return fail(401, "Those details did not match.");
    }
    const user = await ensureOwnerUser();
    const next = "/dashboard/businesses";
    const res = html
      ? redirectSeeOther(next)
      : NextResponse.json({ ok: true, next });
    await setSessionCookie(user.id, res, request);
    return res;
  }

  if (isNorthgateLogin(mail)) {
    if (!(await verifyOwnerPassword(password))) {
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

  if (isLeavesakeLogin(mail)) {
    if (!verifyLeavesakePassword(password)) {
      return fail(401, "Those details did not match.");
    }
    const leavesake = (await readStore()).users.find((u) =>
      isLeavesakeLogin(u.email),
    );
    if (!leavesake) {
      return fail(401, "Those details did not match.");
    }
    const res = html
      ? redirectSeeOther("/dashboard")
      : NextResponse.json({ ok: true });
    await setSessionCookie(leavesake.id, res, request);
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
