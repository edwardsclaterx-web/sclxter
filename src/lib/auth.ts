import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { NextResponse } from "next/server";
import { envSecret } from "./secrets";
import { LEAVESAKE_USER_ID, isLeavesakeLogin } from "./leavesake";
import { NORTHGATE_USER_ID, isNorthgateLogin } from "./northgate";
import { OWNER_USER_ID, ownerUserRecord } from "./owner-auth";
import { readStore } from "./store";
import type { Business, User } from "./types";
import { getOwnedBusiness } from "./access";

const COOKIE = "sclxter_session";
const OTP_COOKIE = "sclxter_otp";

function secretKey() {
  return new TextEncoder().encode(envSecret("SESSION_SECRET"));
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
    secure: proto === "https" || process.env.VERCEL === "1",
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
  res.cookies.set(OTP_COOKIE, "", { ...flags, maxAge: 0 });
}

export function clearSessionCookie(res: NextResponse, request?: Request) {
  const flags = cookieFlags(request);
  res.cookies.set(COOKIE, "", { ...flags, maxAge: 0 });
  res.cookies.set(OTP_COOKIE, "", { ...flags, maxAge: 0 });
}

export async function signOtpPending(userId: string) {
  return new SignJWT({ sub: userId, kind: "otp" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secretKey());
}

export async function setOtpPendingCookie(
  userId: string,
  res: NextResponse,
  request?: Request,
) {
  const token = await signOtpPending(userId);
  const flags = cookieFlags(request);
  res.cookies.set(OTP_COOKIE, token, { ...flags, maxAge: 60 * 10 });
}

export async function getPendingOtpUserId(): Promise<string | null> {
  await connection();
  const jar = await cookies();
  const token = jar.get(OTP_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if ((payload as { kind?: unknown }).kind !== "otp") return null;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
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
  await connection();
  const jar = await cookies();
  const userId = await getUserIdFromToken(jar.get(COOKIE)?.value);
  if (!userId) return null;
  const data = await readStore();
  const found = data.users.find((u) => u.id === userId);
  if (found) return found;
  if (userId === OWNER_USER_ID) return ownerUserRecord();
  if (userId === NORTHGATE_USER_ID) {
    return data.users.find((u) => isNorthgateLogin(u.email)) ?? null;
  }
  if (userId === LEAVESAKE_USER_ID) {
    return data.users.find((u) => isLeavesakeLogin(u.email)) ?? null;
  }
  return null;
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
