import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { loadSecrets } from "./secrets";
import { id } from "./ids";
import { readStore, updateStore } from "./store";
import type { Business, User } from "./types";

const COOKIE = "sclxter_session";

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
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
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

export async function getOrCreateBusiness(user: User): Promise<Business> {
  return updateStore((data) => {
    let biz = data.businesses.find((b) => b.ownerId === user.id);
    if (!biz) {
      const now = new Date().toISOString();
      biz = {
        id: id("biz"),
        ownerId: user.id,
        name: "",
        websiteUrl: "",
        publicId: id("w").replace("w_", ""),
        appearance: {
          assistantName: "Assistant",
          colour: "#ffffff",
          welcome: "Ask about hours, prices, or how to book.",
        },
        widgetConnectedAt: null,
        createdAt: now,
      };
      data.businesses.push(biz);
    }
    return biz;
  });
}

export function publicUser(user: User) {
  return { id: user.id, email: user.email };
}
