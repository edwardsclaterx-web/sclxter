import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadSecrets } from "./secrets";

const PATH = join(process.cwd(), "data", "login-passwords.json");

type Store = Record<string, string>;

function readMap(): Store {
  if (!existsSync(PATH)) return {};
  try {
    const parsed = JSON.parse(readFileSync(PATH, "utf8")) as Store;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Store = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: Store) {
  try {
    mkdirSync(dirname(PATH), { recursive: true });
    writeFileSync(PATH, JSON.stringify(map), { mode: 0o600 });
  } catch {
    /* serverless filesystems are often read-only */
  }
}

function isReservedSecret(password: string) {
  loadSecrets();
  const reserved = [
    process.env.SCLXTER_PASSWORD,
    process.env.LEAVESAKE_PASSWORD,
  ].filter(Boolean) as string[];
  return reserved.some((secret) => secret === password);
}

export function rememberLoginPassword(userId: string, password: string) {
  if (!userId || !password) return;
  if (isReservedSecret(password)) return;
  const map = readMap();
  map[userId] = password;
  writeMap(map);
}
