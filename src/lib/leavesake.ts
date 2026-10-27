import "server-only";

import { timingSafeEqual } from "node:crypto";
import { loadSecrets } from "./secrets";

export const LEAVESAKE_LOGIN = "leavesake";
export const LEAVESAKE_USER_ID = "usr_leavesake";
export const LEAVESAKE_BIZ_ID = "biz_leavesake";
export const LEAVESAKE_PUBLIC_ID = "leavesake";
export const LEAVESAKE_SITE = "https://leavesake.com";

export function isLeavesakeLogin(value: string) {
  return value.trim().toLowerCase() === LEAVESAKE_LOGIN;
}

export function verifyLeavesakePassword(password: string) {
  if (!password) return false;
  loadSecrets();
  const expected = process.env.LEAVESAKE_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
