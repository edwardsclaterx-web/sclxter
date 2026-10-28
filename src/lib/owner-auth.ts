import "server-only";

import { timingSafeEqual } from "node:crypto";
import { loadSecrets } from "./secrets";
import type { StoreData, User } from "./types";

/** Public contact address. Not the Sign in identity. */
export const OWNER_EMAIL = "sclxter@outlook.com";
export const OWNER_LOGIN = "scl";
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

/** Sign in identity: `scl`, case-insensitive, no @. */
export function isOwnerLogin(value: string) {
  return value.trim().toLowerCase() === OWNER_LOGIN;
}

/** Owner account checks (header, billing hide, admin). Login uses isOwnerLogin. */
export function isOwnerEmail(email: string) {
  const v = email.trim().toLowerCase();
  return v === OWNER_LOGIN || v === OWNER_EMAIL;
}

export function isOwnerUser(user: { id: string; email: string }) {
  return user.id === OWNER_USER_ID || isOwnerEmail(user.email);
}

export function ownerUserRecord(): User {
  return {
    id: OWNER_USER_ID,
    email: OWNER_LOGIN,
    passwordHash: "!",
    createdAt: "2026-10-01T09:00:00.000Z",
  };
}

export function findOwnerUser(data: StoreData): User | undefined {
  return data.users.find(
    (u) =>
      u.id === OWNER_USER_ID ||
      isOwnerLogin(u.email) ||
      u.email.trim().toLowerCase() === OWNER_EMAIL,
  );
}

export function migrateOwnerIdentity(data: StoreData) {
  const user = findOwnerUser(data);
  if (!user) return;
  user.id = OWNER_USER_ID;
  user.email = OWNER_LOGIN;
  user.passwordHash = "!";
}

export async function ensureOwnerUser(): Promise<User> {
  const { updateStore } = await import("./store");
  return updateStore((data) => {
    let user = findOwnerUser(data);
    if (!user) {
      user = ownerUserRecord();
      data.users.push(user);
    } else {
      user.id = OWNER_USER_ID;
      user.email = OWNER_LOGIN;
      user.passwordHash = "!";
    }
    return user;
  });
}
