import "server-only";

import { timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { hashPassword, checkPassword } from "./auth";
import { id } from "./ids";
import { loadSecrets } from "./secrets";
import { updateStore } from "./store";
import type { User } from "./types";

export const OWNER_EMAIL = "sclxter@outlook.com";

const HASH_PATH = join(process.cwd(), "data", "owner-auth.json");

type OwnerHashes = {
  passwordHash: string;
};

let syncStarted = false;

function readHashes(): OwnerHashes | null {
  if (!existsSync(HASH_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync(HASH_PATH, "utf8")) as OwnerHashes;
    if (
      typeof parsed.passwordHash === "string" &&
      parsed.passwordHash.startsWith("$2")
    ) {
      return { passwordHash: parsed.passwordHash };
    }
  } catch {
    return null;
  }
  return null;
}

function writeHashes(hashes: OwnerHashes) {
  mkdirSync(dirname(HASH_PATH), { recursive: true });
  writeFileSync(HASH_PATH, JSON.stringify(hashes), { mode: 0o600 });
}

function secretEqual(given: string, expected: string) {
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function syncHashFromEnv() {
  loadSecrets();
  const password = process.env.SCLXTER_PASSWORD;
  if (!password) return;
  const existing = readHashes();
  if (existing && (await checkPassword(password, existing.passwordHash))) {
    return;
  }
  writeHashes({ passwordHash: await hashPassword(password) });
}

export async function ownerAuthReady() {
  loadSecrets();
  if (process.env.SCLXTER_PASSWORD) return true;
  if (!syncStarted) {
    syncStarted = true;
    await syncHashFromEnv();
  }
  return Boolean(readHashes());
}

export async function verifyOwnerPassword(password: string): Promise<boolean> {
  if (!password) return false;
  loadSecrets();
  const expected = process.env.SCLXTER_PASSWORD;
  if (expected && secretEqual(password, expected)) {
    void syncHashFromEnv();
    return true;
  }
  await ownerAuthReady();
  await syncHashFromEnv();
  const hashes = readHashes();
  if (!hashes) return false;
  return checkPassword(password, hashes.passwordHash);
}

export function isOwnerEmail(email: string) {
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

export async function ensureOwnerUser(): Promise<User> {
  return updateStore((data) => {
    let user = data.users.find((u) => u.email === OWNER_EMAIL);
    if (!user) {
      user = {
        id: id("usr"),
        email: OWNER_EMAIL,
        passwordHash: "!",
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
    }
    return user;
  });
}
