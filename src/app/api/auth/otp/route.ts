import { NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  getPendingOtpUserId,
  setSessionCookie,
} from "@/lib/auth";
import { isOwnerUser } from "@/lib/owner-auth";
import { consumeOtp, issueOtp, maskDest } from "@/lib/otp";
import { redirectSeeOther } from "@/lib/http-redirect";
import { wantsHtml } from "@/lib/read-login-body";
import { isLeavesakeLogin } from "@/lib/leavesake";
import { isNorthgateLogin } from "@/lib/northgate";
import { readStore } from "@/lib/store";

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
  const userId = await getPendingOtpUserId();
  if (!userId) return fail(401, "Sign in again to get a new code.");

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

  if (resend) {
    const user = (await readStore()).users.find((u) => u.id === userId);
    if (!user) return fail(401, "Sign in again to get a new code.");
    const issued = await issueOtp(user);
    if (!issued.sent) {
      return fail(503, "Could not send the sign-in code.");
    }
    if (html) return redirectSeeOther("/account?verify=1");
    return NextResponse.json({
      ok: true,
      dest: maskDest(issued.dest),
    });
  }

  const result = await consumeOtp(userId, code);
  if (!result.ok) return fail(401, result.error);

  const user = (await readStore()).users.find((u) => u.id === userId);
  if (!user) return fail(401, "Sign in again to get a new code.");
  const next = nextFor(user);
  const res = html
    ? redirectSeeOther(next)
    : NextResponse.json({ ok: true, next });
  await setSessionCookie(user.id, res, request);
  return res;
}
