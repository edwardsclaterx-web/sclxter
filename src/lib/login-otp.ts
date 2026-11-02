import "server-only";

import { NextResponse } from "next/server";
import { setOtpPendingCookie } from "./auth";
import { redirectSeeOther } from "./http-redirect";
import { MAIL_FAIL } from "./mail";
import { issueOtp, maskDest } from "./otp";
import type { User } from "./types";

export async function beginLoginOtp(
  user: User,
  next: string,
  html: boolean,
  request: Request,
) {
  let dest = maskDest("the email on this account");
  let mailError: string | null = MAIL_FAIL;
  try {
    const issued = await issueOtp(user);
    dest = maskDest(issued.dest);
    mailError = issued.mailError;
    const path = issued.sent
      ? "/account?verify=1"
      : "/account?verify=1&mail=1";
    const res = html
      ? redirectSeeOther(path)
      : NextResponse.json({
          ok: true,
          needOtp: true,
          next: path,
          dest,
          mailError,
          home: next,
        });
    try {
      await setOtpPendingCookie(issued.pending, res, request);
    } catch {
      /* still return the code page */
    }
    return res;
  } catch {
    const res = html
      ? redirectSeeOther("/account?verify=1&mail=1")
      : NextResponse.json({
          ok: true,
          needOtp: true,
          next: "/account?verify=1&mail=1",
          dest,
          mailError: MAIL_FAIL,
          home: next,
        });
    return res;
  }
}
