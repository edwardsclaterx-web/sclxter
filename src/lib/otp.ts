import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { MAIL_FAIL, sendProductMail } from "./mail";
import { OTP_SUBJECT, otpEmailHtml, otpEmailText } from "./otp-email";
import { OWNER_EMAIL, isOwnerLogin, isOwnerUser } from "./owner-auth";
import type { User } from "./types";

const TTL_MS = 8 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpPending = {
  userId: string;
  dest: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function hashesEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function otpDestination(user: User) {
  if (isOwnerLogin(user.email) || isOwnerUser(user)) return OWNER_EMAIL;
  const mail = user.email.trim().toLowerCase();
  if (mail.includes("@")) return mail;
  return OWNER_EMAIL;
}

export function maskDest(dest: string) {
  const at = dest.indexOf("@");
  if (at < 1) return "the email on this account";
  const name = dest.slice(0, at);
  const domain = dest.slice(at);
  const shown = name.slice(0, 1);
  return `${shown}${"*".repeat(Math.max(1, name.length - 1))}${domain}`;
}

export async function issueOtp(user: User) {
  const dest = otpDestination(user);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const pending: OtpPending = {
    userId: user.id,
    dest,
    codeHash: hashCode(code),
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
  };
  let sent = false;
  let mailError: string | null = MAIL_FAIL;
  try {
    const mail = await sendProductMail({
      to: dest,
      subject: OTP_SUBJECT,
      text: otpEmailText(code),
      html: otpEmailHtml(code),
    });
    sent = mail.sent;
    mailError = mail.mailError;
  } catch {
    sent = false;
  }
  return {
    pending,
    dest,
    sent,
    mailError: sent ? null : mailError || MAIL_FAIL,
  };
}

export function checkOtp(pending: OtpPending, code: string) {
  const digits = code.replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) {
    return { ok: false as const, error: "Enter the 6-digit code.", pending };
  }
  if (pending.expiresAt < Date.now()) {
    return {
      ok: false as const,
      error: "That code has expired. Sign in again.",
      pending: null,
    };
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false as const,
      error: "Too many tries. Sign in again.",
      pending: null,
    };
  }
  if (!hashesEqual(pending.codeHash, hashCode(digits))) {
    return {
      ok: false as const,
      error: "That code did not match.",
      pending: { ...pending, attempts: pending.attempts + 1 },
    };
  }
  return { ok: true as const };
}
