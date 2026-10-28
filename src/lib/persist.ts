import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StoreData, SupportThread } from "./types";

const KEY = "sclxter-store";
const SUPPORT_KEY = "sclxter-support-threads";
const FILE_LOCAL = join(process.cwd(), "data", "store.json");
const FILE_TMP = join(tmpdir(), "sclxter-store.json");

function kvCreds() {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";
  if (!url || !token) return null;
  return { url, token };
}

async function kvRun(command: unknown[]) {
  const creds = kvCreds();
  if (!creds) return null;
  const res = await fetch(creds.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${creds.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as { result?: unknown };
}

function parseStore(raw: string): StoreData | null {
  try {
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.businesses)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readFile(path: string): StoreData | null {
  if (!existsSync(path)) return null;
  try {
    return parseStore(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeFile(path: string, data: StoreData) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data), { mode: 0o600 });
}

async function readKv(): Promise<StoreData | null> {
  const out = await kvRun(["GET", KEY]);
  const result = out?.result;
  if (typeof result === "string") return parseStore(result);
  if (result && typeof result === "object") return result as StoreData;
  return null;
}

async function writeKv(data: StoreData) {
  const out = await kvRun(["SET", KEY, JSON.stringify(data)]);
  return Boolean(out);
}

function asThreads(raw: unknown): SupportThread[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (t): t is SupportThread =>
      Boolean(t) &&
      typeof t === "object" &&
      typeof (t as SupportThread).id === "string" &&
      typeof (t as SupportThread).businessId === "string",
  );
}

function mergeThreads(a: SupportThread[] = [], b: SupportThread[] = []) {
  const byBiz = new Map<string, SupportThread>();
  for (const t of [...a, ...b]) {
    const prev = byBiz.get(t.businessId);
    if (!prev || (t.updatedAt || "") >= (prev.updatedAt || "")) {
      byBiz.set(t.businessId, t);
    }
  }
  return [...byBiz.values()];
}

async function readKvThreads(): Promise<SupportThread[] | null> {
  const out = await kvRun(["GET", SUPPORT_KEY]);
  const result = out?.result;
  if (typeof result === "string") {
    try {
      return asThreads(JSON.parse(result));
    } catch {
      return null;
    }
  }
  return asThreads(result);
}

async function writeKvThreads(threads: SupportThread[]) {
  const out = await kvRun(["SET", SUPPORT_KEY, JSON.stringify(threads)]);
  return Boolean(out);
}

async function readBlob(): Promise<StoreData | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `${KEY}.json`, token, limit: 5 });
    const blob = blobs.find((b) => b.pathname === `${KEY}.json`) || blobs[0];
    if (!blob?.url) return null;
    const res = await fetch(blob.url, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return parseStore(await res.text());
  } catch {
    return null;
  }
}

async function writeBlob(data: StoreData) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  try {
    const { put } = await import("@vercel/blob");
    await put(`${KEY}.json`, JSON.stringify(data), {
      access: "private",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}

function onVercel() {
  return process.env.VERCEL === "1";
}

function withThreads(data: StoreData | null, extra: SupportThread[] | null) {
  if (!data) return null;
  if (extra?.length) {
    data.supportThreads = mergeThreads(data.supportThreads, extra);
  }
  data.supportThreads = data.supportThreads ?? [];
  return data;
}

export async function readPersistedStore(): Promise<StoreData | null> {
  const extra = await readKvThreads();
  const fromKv = await readKv();
  if (fromKv) return withThreads(fromKv, extra);
  const fromBlob = await readBlob();
  if (fromBlob) return withThreads(fromBlob, extra);
  if (!onVercel()) {
    const local = readFile(FILE_LOCAL);
    if (local) return withThreads(local, extra);
  }
  const tmp = withThreads(readFile(FILE_TMP), extra);
  if (tmp) return tmp;
  if (extra?.length) {
    return {
      users: [],
      businesses: [],
      knowledge: [],
      leads: [],
      conversations: [],
      supportThreads: extra,
      knowledgeGaps: [],
      settings: { instructions: [] },
    };
  }
  return null;
}

export async function writePersistedStore(data: StoreData): Promise<void> {
  const json = JSON.parse(JSON.stringify(data)) as StoreData;
  json.supportThreads = json.supportThreads ?? [];
  const kv = await writeKv(json);
  await writeKvThreads(json.supportThreads);
  if (!kv) await writeBlob(json);
  try {
    if (!onVercel()) writeFile(FILE_LOCAL, json);
  } catch {
    /* read-only deploy */
  }
  try {
    writeFile(FILE_TMP, json);
  } catch {
    /* ignore */
  }
}

export function persistConfigured() {
  return Boolean(kvCreds() || process.env.BLOB_READ_WRITE_TOKEN);
}
