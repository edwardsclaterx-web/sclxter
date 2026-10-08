import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isOwnerEmail } from "./owner-auth";
import { loadSecrets } from "./secrets";
import { readStore } from "./store";
import type { Business, User } from "./types";
import { createBusinessForSignup, getOwnedBusiness } from "./access";

const COOKIE = "sclxter_session";
const PENDING = "sclxter_login_pending";

function secretKey() {
  loadSecrets();
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function checkPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function signSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function setSessionCookie(userId: string) {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  store.delete(PENDING);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete(PENDING);
}

export async function setOwnerStep2Cookie() {
  const token = await new SignJWT({ purpose: "owner-step2" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey());
  const store = await cookies();
  store.set(PENDING, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function hasOwnerStep2Pending() {
  const jar = await cookies();
  const token = jar.get(PENDING)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.purpose === "owner-step2";
  } catch {
    return false;
  }
}

export async function getUserIdFromToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = await getUserIdFromToken(jar.get(COOKIE)?.value);
  if (!userId) return null;
  const data = await readStore();
  return data.users.find((u) => u.id === userId) ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

export async function getOrCreateBusiness(user: User): Promise<Business | null> {
  if (isOwnerEmail(user.email)) {
    return getOwnedBusiness(user);
  }
  const existing = await getOwnedBusiness(user);
  if (existing) return existing;
  return createBusinessForSignup(user);
}

export function publicUser(user: User) {
  return { id: user.id, email: user.email };
}
