import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { OWNER_EMAIL, isOwnerLogin, isOwnerUser } from "./owner-auth";
import { sendProductMail } from "./mail";
import { updateStore } from "./store";
import type { User } from "./types";

const TTL_MS = 8 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  await updateStore((data) => {
    data.otpChallenges = (data.otpChallenges ?? []).filter(
      (o) => o.userId !== user.id,
    );
    data.otpChallenges.push({
      userId: user.id,
      dest,
      codeHash: hashCode(code),
      expiresAt,
      attempts: 0,
    });
    return true;
  });
  const text = `Your sclxter sign-in code is ${code}. It expires in 8 minutes and can be used once. If you did not try to sign in, ignore this email.`;
  const mail = await sendProductMail({
    to: dest,
    subject: "Your sclxter sign-in code",
    text,
  });
  return { dest, sent: mail.sent, mocked: mail.mocked };
}

export async function consumeOtp(userId: string, code: string) {
  const digits = code.replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) return { ok: false as const, error: "Enter the 6-digit code." };
  const now = Date.now();
  let error = "That code did not match.";
  const ok = await updateStore((data) => {
    const list = data.otpChallenges ?? [];
    const row = list.find((o) => o.userId === userId);
    if (!row) {
      error = "Sign in again to get a new code.";
      return false;
    }
    if (Date.parse(row.expiresAt) < now) {
      data.otpChallenges = list.filter((o) => o.userId !== userId);
      error = "That code has expired. Sign in again.";
      return false;
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      data.otpChallenges = list.filter((o) => o.userId !== userId);
      error = "Too many tries. Sign in again.";
      return false;
    }
    if (!hashesEqual(row.codeHash, hashCode(digits))) {
      row.attempts += 1;
      error = "That code did not match.";
      return false;
    }
    data.otpChallenges = list.filter((o) => o.userId !== userId);
    return true;
  });
  return ok ? { ok: true as const } : { ok: false as const, error };
}
