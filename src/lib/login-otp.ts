import "server-only";

import { NextResponse } from "next/server";
import { setOtpPendingCookie } from "./auth";
import { redirectSeeOther } from "./http-redirect";
import { issueOtp, maskDest } from "./otp";
import type { User } from "./types";

export async function beginLoginOtp(
  user: User,
  next: string,
  html: boolean,
  request: Request,
) {
  const issued = await issueOtp(user);
  if (!issued.sent) {
    if (html) return redirectSeeOther("/account?error=1");
    return NextResponse.json(
      { error: "Could not send the sign-in code." },
      { status: 503 },
    );
  }
  const res = html
    ? redirectSeeOther("/account?verify=1")
    : NextResponse.json({
        ok: true,
        needOtp: true,
        next: "/account?verify=1",
        dest: maskDest(issued.dest),
        home: next,
      });
  await setOtpPendingCookie(user.id, res, request);
  return res;
}
