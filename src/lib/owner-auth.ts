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
  password2Hash: string;
};

let syncStarted = false;

function readHashes(): OwnerHashes | null {
  if (!existsSync(HASH_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync(HASH_PATH, "utf8")) as OwnerHashes;
    if (
      typeof parsed.passwordHash === "string" &&
      parsed.passwordHash.startsWith("$2") &&
      typeof parsed.password2Hash === "string" &&
      parsed.password2Hash.startsWith("$2")
    ) {
      return parsed;
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

async function syncHashesFromEnv() {
  loadSecrets();
  const first = process.env.SCLXTER_PASSWORD;
  const second = process.env.SCLXTER_PASSWORD_2;
  if (!first || !second) return;
  writeHashes({
    passwordHash: await hashPassword(first),
    password2Hash: await hashPassword(second),
  });
}

export async function ownerAuthReady() {
  loadSecrets();
  if (process.env.SCLXTER_PASSWORD && process.env.SCLXTER_PASSWORD_2) {
    return true;
  }
  if (!syncStarted) {
    syncStarted = true;
    await syncHashesFromEnv();
  }
  return Boolean(readHashes());
}

export async function verifyOwnerPassword(
  layer: 1 | 2,
  password: string,
): Promise<boolean> {
  if (!password) return false;
  loadSecrets();
  const expected =
    layer === 1 ? process.env.SCLXTER_PASSWORD : process.env.SCLXTER_PASSWORD_2;
  if (expected && secretEqual(password, expected)) return true;
  await ownerAuthReady();
  const hashes = readHashes();
  if (!hashes) return false;
  const stored = layer === 1 ? hashes.passwordHash : hashes.password2Hash;
  return checkPassword(password, stored);
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
