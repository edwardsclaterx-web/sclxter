import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { loadSecrets } from "./secrets";
import { readStore } from "./store";
import type { Business, User } from "./types";
import { getOwnedBusiness } from "./access";

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

function cookieFlags(request?: Request) {
  const proto =
    request?.headers.get("x-forwarded-proto") ||
    (request ? new URL(request.url).protocol.replace(":", "") : "http");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: proto === "https",
  };
}

export async function setSessionCookie(
  userId: string,
  res: NextResponse,
  request?: Request,
) {
  const token = await signSession(userId);
  const flags = cookieFlags(request);
  res.cookies.set(COOKIE, token, { ...flags, maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set(PENDING, "", { ...flags, maxAge: 0 });
}

export function clearSessionCookie(res: NextResponse, request?: Request) {
  const flags = cookieFlags(request);
  res.cookies.set(COOKIE, "", { ...flags, maxAge: 0 });
  res.cookies.set(PENDING, "", { ...flags, maxAge: 0 });
}

export async function setOwnerStep2Cookie(res: NextResponse, request?: Request) {
  const token = await new SignJWT({ purpose: "owner-step2" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey());
  res.cookies.set(PENDING, token, {
    ...cookieFlags(request),
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
  return getOwnedBusiness(user);
}

export function publicUser(user: User) {
  return { id: user.id, email: user.email };
}
