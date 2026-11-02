import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { checkPassword } from "@/lib/auth";
import { beginLoginOtp } from "@/lib/login-otp";
import { redirectSeeOther } from "@/lib/http-redirect";
import {
  ensureOwnerUser,
  isOwnerEmail,
  isOwnerLogin,
  ownerAuthReady,
  ownerUserRecord,
  verifyOwnerPassword,
} from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";
import {
  ensureLeavesakeUser,
  isLeavesakeLogin,
  leavesakeAuthReady,
  verifyLeavesakePassword,
} from "@/lib/leavesake";
import { isNorthgateLogin } from "@/lib/northgate";
import { leavesakeStub, northgateStub } from "@/lib/login-user";
import { loadSecrets } from "@/lib/secrets";
import { readStore } from "@/lib/store";

export async function POST(request: Request) {
  loadSecrets();
  const { email, password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string, kind: "error" | "admin" = "error") => {
    if (html) {
      return redirectSeeOther(`/account?${kind}=1`);
    }
    return NextResponse.json({ error }, { status });
  };

  const mail = email.trim().toLowerCase();

  if (isOwnerLogin(mail) || isOwnerEmail(mail)) {
    if (!(await ownerAuthReady())) {
      return fail(503, "admin password not configured", "admin");
    }
    if (!(await verifyOwnerPassword(password))) {
      return fail(401, "Those details did not match.");
    }
    let user;
    try {
      user = await ensureOwnerUser();
    } catch {
      user = ownerUserRecord();
    }
    return beginLoginOtp(user, "/dashboard/businesses", html, request);
  }

  if (isNorthgateLogin(mail)) {
    if (!(await verifyOwnerPassword(password))) {
      return fail(401, "Those details did not match.");
    }
    let northgate;
    try {
      northgate = (await readStore()).users.find((u) =>
        isNorthgateLogin(u.email),
      );
    } catch {
      northgate = undefined;
    }
    return beginLoginOtp(
      northgate ?? northgateStub(),
      "/dashboard",
      html,
      request,
    );
  }

  if (isLeavesakeLogin(mail)) {
    if (!leavesakeAuthReady()) {
      return fail(503, "Sign in is not configured on this server.");
    }
    if (!(await verifyLeavesakePassword(password))) {
      return fail(401, "Those details did not match.");
    }
    let user;
    try {
      user = await ensureLeavesakeUser();
    } catch {
      user = leavesakeStub();
    }
    return beginLoginOtp(user, "/dashboard", html, request);
  }

  const existing = (await readStore()).users.find((u) => u.email === mail);
  if (!existing || !(await checkPassword(password, existing.passwordHash))) {
    return fail(401, "Those details did not match.");
  }
  return beginLoginOtp(existing, "/dashboard", html, request);
}
