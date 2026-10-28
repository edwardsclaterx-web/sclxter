import "server-only";

import { timingSafeEqual } from "node:crypto";
import { envSecret } from "./secrets";

export const LEAVESAKE_LOGIN = "leavesake";
export const LEAVESAKE_USER_ID = "usr_leavesake";
export const LEAVESAKE_BIZ_ID = "biz_leavesake";
export const LEAVESAKE_PUBLIC_ID = "leavesake";
export const LEAVESAKE_SITE = "https://leavesake.com";

export function isLeavesakeLogin(value: string) {
  const v = value.trim().toLowerCase();
  if (v.includes("@")) return false;
  return v === LEAVESAKE_LOGIN;
}

export function leavesakeAuthReady() {
  return Boolean(envSecret("LEAVESAKE_PASSWORD"));
}

function secretEqual(given: string, expected: string) {
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function verifyLeavesakePassword(password: string): Promise<boolean> {
  if (!password) return false;
  const expected = envSecret("LEAVESAKE_PASSWORD");
  if (!expected) return false;
  const given = password.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/[\r\n]+$/g, "");
  return secretEqual(given, expected);
}

export async function ensureLeavesakeUser() {
  const { updateStore } = await import("./store");
  const { ensureLeavesakeShop } = await import("./seed");
  return updateStore((data) => {
    ensureLeavesakeShop(data);
    const user = data.users.find(
      (u) => u.id === LEAVESAKE_USER_ID || isLeavesakeLogin(u.email),
    );
    if (!user) {
      throw new Error("Leavesake shop is missing.");
    }
    user.id = LEAVESAKE_USER_ID;
    user.email = LEAVESAKE_LOGIN;
    user.passwordHash = "!";
    return user;
  });
}
