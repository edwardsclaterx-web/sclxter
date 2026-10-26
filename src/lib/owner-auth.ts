import "server-only";

import { timingSafeEqual } from "node:crypto";
import { loadSecrets } from "./secrets";
import { updateStore } from "./store";
import type { User } from "./types";

export const OWNER_EMAIL = "sclxter@outlook.com";
export const OWNER_USER_ID = "usr_owner";

function secretEqual(given: string, expected: string) {
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function ownerAuthReady() {
  loadSecrets();
  return Boolean(process.env.SCLXTER_PASSWORD);
}

export async function verifyOwnerPassword(password: string): Promise<boolean> {
  if (!password) return false;
  loadSecrets();
  const expected = process.env.SCLXTER_PASSWORD;
  if (!expected) return false;
  return secretEqual(password, expected);
}

export function isOwnerEmail(email: string) {
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

export function ownerUserRecord(): User {
  return {
    id: OWNER_USER_ID,
    email: OWNER_EMAIL,
    passwordHash: "!",
    createdAt: "2026-10-01T09:00:00.000Z",
  };
}

export async function ensureOwnerUser(): Promise<User> {
  return updateStore((data) => {
    let user = data.users.find(
      (u) => u.email === OWNER_EMAIL || u.id === OWNER_USER_ID,
    );
    if (!user) {
      user = ownerUserRecord();
      data.users.push(user);
    } else {
      user.id = OWNER_USER_ID;
      user.email = OWNER_EMAIL;
    }
    return user;
  });
}
