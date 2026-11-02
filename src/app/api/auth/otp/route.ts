import { NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  clearOtpPendingCookie,
  getPendingOtp,
  setOtpPendingCookie,
  setSessionCookie,
} from "@/lib/auth";
import { isOwnerUser } from "@/lib/owner-auth";
import { checkOtp, issueOtp, maskDest } from "@/lib/otp";
import { redirectSeeOther } from "@/lib/http-redirect";
import { wantsHtml } from "@/lib/read-login-body";
import { isLeavesakeLogin } from "@/lib/leavesake";
import { isNorthgateLogin } from "@/lib/northgate";
import { userById } from "@/lib/login-user";
import { MAIL_FAIL } from "@/lib/mail";

function nextFor(user: { id: string; email: string }) {
  if (isOwnerUser(user)) return "/dashboard/businesses";
  if (isNorthgateLogin(user.email) || isLeavesakeLogin(user.email)) {
    return "/dashboard";
  }
  return "/dashboard";
}

export async function POST(request: Request) {
  const html = wantsHtml(request);
  const fail = (status: number, error: string) => {
    if (html) return redirectSeeOther("/account?verify=1&otp=1");
    return NextResponse.json({ error }, { status });
  };
  const pending = await getPendingOtp();
  if (!pending) return fail(401, "Sign in again to get a new code.");

  let code = "";
  let resend = false;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      code?: unknown;
      resend?: unknown;
    };
    code = typeof body.code === "string" ? body.code : "";
    resend = body.resend === true;
  } else {
    const form = await request.formData();
    const v = form.get("code");
    code = typeof v === "string" ? v : "";
    resend = form.get("resend") === "1";
  }

  const user = await userById(pending.userId);
  if (!user) return fail(401, "Sign in again to get a new code.");

  if (resend) {
    const issued = await issueOtp(user);
    const path = issued.sent
      ? "/account?verify=1"
      : "/account?verify=1&mail=1";
    const res = html
      ? redirectSeeOther(path)
      : NextResponse.json({
          ok: true,
          dest: maskDest(issued.dest),
          mailError: issued.mailError,
        });
    try {
      await setOtpPendingCookie(issued.pending, res, request);
    } catch {
      /* still return */
    }
    if (!issued.sent && !html) {
      return NextResponse.json(
        {
          ok: true,
          dest: maskDest(issued.dest),
          mailError: issued.mailError || MAIL_FAIL,
        },
        { status: 200 },
      );
    }
    return res;
  }

  const result = checkOtp(pending, code);
  if (!result.ok) {
    const res = fail(401, result.error);
    if (result.pending) {
      try {
        await setOtpPendingCookie(result.pending, res, request);
      } catch {
        /* ignore */
      }
    } else {
      clearOtpPendingCookie(res, request);
    }
    return res;
  }

  const next = nextFor(user);
  const res = html
    ? redirectSeeOther(next)
    : NextResponse.json({ ok: true, next });
  await setSessionCookie(user.id, res, request);
  return res;
}
