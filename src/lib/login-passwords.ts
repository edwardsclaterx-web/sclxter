import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isOwnerEmail } from "./owner-auth";
import { loadSecrets } from "./secrets";
import type { User } from "./types";

const PATH = join(process.cwd(), "data", "login-passwords.json");
const DAVID_FIRST = "owner-first";

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
  mkdirSync(dirname(PATH), { recursive: true });
  writeFileSync(PATH, JSON.stringify(map), { mode: 0o600 });
}

function rejectSecond(password: string) {
  loadSecrets();
  const second = process.env.SCLXTER_PASSWORD_2;
  return Boolean(second && password && password === second);
}

export function rememberLoginPassword(userId: string, password: string) {
  if (!userId || !password) return;
  if (rejectSecond(password)) return;
  const map = readMap();
  map[userId] = password;
  writeMap(map);
}

export function rememberDavidFirstPassword(password: string) {
  rememberLoginPassword(DAVID_FIRST, password);
}

export function accountPasswordFor(user: User) {
  loadSecrets();
  const map = readMap();
  if (isOwnerEmail(user.email)) {
    const first =
      map[DAVID_FIRST] || map[user.id] || process.env.SCLXTER_PASSWORD || "";
    if (rejectSecond(first)) return process.env.SCLXTER_PASSWORD || "";
    return first;
  }
  const saved = map[user.id] || "";
  if (rejectSecond(saved)) return "";
  return saved;
}
