import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { envSecret, loadSecrets } from "./secrets";
import type { Business, KnowledgeItem, StoreData, SupportThread } from "./types";

const KEY = "sclxter-store";
const META_KEY = "sclxter:meta";
const SUPPORT_KEY = "sclxter-support-threads";
const FILE_LOCAL = join(process.cwd(), "data", "store.json");
const FILE_TMP = join(tmpdir(), "sclxter-store.json");

let lastError = "";
let lastUrlKey = "";
let lastTokenKey = "";
let lastBlobKey = "";

export function persistLastError() {
  return lastError;
}

export function persistEnvNames() {
  kvCreds();
  blobToken();
  loadSecrets();
  const kvLike = Object.keys(process.env)
    .filter((k) => /KV|UPSTASH|BLOB|REDIS|STORAGE/i.test(k))
    .sort();
  return {
    urlKey: lastUrlKey || null,
    tokenKey: lastTokenKey || null,
    blobKey: lastBlobKey || null,
    kvLikeKeys: kvLike,
  };
}

export function sanitizePersistError(raw: string) {
  return raw
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+/g, "[redacted]")
    .replace(/https?:\/\/[^\s"'\\]+/gi, "[url]")
    .replace(/[A-Za-z0-9+/]{40,}={0,2}/g, "[redacted]")
    .slice(0, 280);
}

function noteError(raw: string) {
  lastError = sanitizePersistError(raw);
  return lastError;
}

function isReadOnlyName(name: string) {
  return /READ_ONLY/i.test(name);
}

function trimEnv(value: string | undefined) {
  if (typeof value !== "string") return "";
  return value.replace(/^\uFEFF/, "").replace(/[\r\n]+$/g, "").trim();
}

/**
 * Static process.env.NAME reads so Next.js keeps these in the server
 * runtime. Dynamic process.env[name] is stripped and looks like
 * "credentials missing" even when Vercel has the vars.
 */
function bundledEnv() {
  loadSecrets();
  return {
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    KV_REST_API_KV_REST_API_URL: process.env.KV_REST_API_KV_REST_API_URL,
    KV_KV_REST_API_URL: process.env.KV_KV_REST_API_URL,
    KV_REST_API_REST_URL: process.env.KV_REST_API_REST_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    KV_REST_API_KV_REST_API_TOKEN: process.env.KV_REST_API_KV_REST_API_TOKEN,
    KV_KV_REST_API_TOKEN: process.env.KV_KV_REST_API_TOKEN,
    KV_REST_API_READ_WRITE_TOKEN: process.env.KV_REST_API_READ_WRITE_TOKEN,
    KV_URL: process.env.KV_URL,
    REDIS_URL: process.env.REDIS_URL,
    KV_REST_API_REDIS_URL: process.env.KV_REST_API_REDIS_URL,
    UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
    STORAGE_URL: process.env.STORAGE_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    VERCEL_BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    VERCEL: process.env.VERCEL,
  };
}

function pickFromBag(
  bag: Record<string, string | undefined>,
  names: string[],
  skipReadOnly = false,
) {
  for (const name of names) {
    if (skipReadOnly && isReadOnlyName(name)) continue;
    const value = trimEnv(bag[name]);
    if (value) return { name, value };
  }
  return null;
}

function credsFromRedisUrl(raw: string) {
  try {
    const u = new URL(raw);
    const token = decodeURIComponent(u.password || "");
    const host = u.hostname;
    if (!token || !host) return null;
    if (u.protocol !== "redis:" && u.protocol !== "rediss:") return null;
    return { url: `https://${host}`, token };
  } catch {
    return null;
  }
}

function kvCreds() {
  const bag = bundledEnv();
  const url = pickFromBag(bag, [
    "KV_REST_API_URL",
    "UPSTASH_REDIS_REST_URL",
    "KV_REST_API_KV_REST_API_URL",
    "KV_KV_REST_API_URL",
    "KV_REST_API_REST_URL",
  ]);
  const token = pickFromBag(
    bag,
    [
      "KV_REST_API_TOKEN",
      "UPSTASH_REDIS_REST_TOKEN",
      "KV_REST_API_KV_REST_API_TOKEN",
      "KV_KV_REST_API_TOKEN",
      "KV_REST_API_READ_WRITE_TOKEN",
    ],
    true,
  );
  if (url && token) {
    lastUrlKey = url.name;
    lastTokenKey = token.name;
    return { url: url.value, token: token.value };
  }
  const redis = pickFromBag(bag, [
    "KV_REST_API_REDIS_URL",
    "KV_URL",
    "REDIS_URL",
    "UPSTASH_REDIS_URL",
  ]);
  if (redis) {
    const derived = credsFromRedisUrl(redis.value);
    if (derived) {
      lastUrlKey = `${redis.name} (derived REST)`;
      lastTokenKey = `${redis.name} (password)`;
      return derived;
    }
  }
  lastUrlKey = url?.name || "";
  lastTokenKey = token?.name || "";
  return null;
}

function blobToken() {
  const found = pickFromBag(bundledEnv(), [
    "BLOB_READ_WRITE_TOKEN",
    "VERCEL_BLOB_READ_WRITE_TOKEN",
  ]);
  lastBlobKey = found?.name || "";
  return found?.value || "";
}

function onVercel() {
  return trimEnv(bundledEnv().VERCEL) === "1";
}

type KvOut = { ok: boolean; result?: unknown; error?: string; status?: number };

async function kvRun(command: unknown[]): Promise<KvOut> {
  const creds = kvCreds();
  if (!creds) {
    return { ok: false, error: noteError("kv credentials missing") };
  }
  try {
    const res = await fetch(creds.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${creds.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    const text = await res.text();
    let parsed: { result?: unknown; error?: string } = {};
    try {
      parsed = text ? (JSON.parse(text) as { result?: unknown; error?: string }) : {};
    } catch {
      parsed = { error: text.slice(0, 200) };
    }
    if (!res.ok) {
      const err =
        parsed.error ||
        (typeof parsed.result === "string" ? parsed.result : "") ||
        text.slice(0, 200) ||
        `HTTP ${res.status}`;
      return { ok: false, error: noteError(err), status: res.status };
    }
    return { ok: true, result: parsed.result, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "kv fetch failed";
    return { ok: false, error: noteError(message) };
  }
}

function kvWriteOk(out: KvOut) {
  if (!out.ok) return false;
  const result = out.result;
  if (result === false) return false;
  if (typeof result === "string" && /^ERR/i.test(result)) {
    noteError(result);
    return false;
  }
  return true;
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

function asStore(raw: unknown): StoreData | null {
  if (typeof raw === "string") return parseStore(raw);
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as StoreData;
  if (!Array.isArray(parsed.users) || !Array.isArray(parsed.businesses)) {
    return null;
  }
  return parsed;
}

function parseKvValue(result: unknown) {
  if (typeof result === "string") {
    try {
      return JSON.parse(result) as unknown;
    } catch {
      return result;
    }
  }
  return result ?? null;
}

async function kvGet(key: string) {
  const out = await kvRun(["GET", key]);
  if (!out.ok) return null;
  return parseKvValue(out.result);
}

async function kvSet(key: string, value: unknown) {
  const out = await kvRun(["SET", key, JSON.stringify(value)]);
  return kvWriteOk(out);
}

function bizKey(id: string) {
  return `sclxter:biz:${id}`;
}
function knowKey(id: string) {
  return `sclxter:know:${id}`;
}

function persistRev(data: StoreData | null) {
  const n = Number(data?.settings?.persistRev);
  return Number.isFinite(n) ? n : 0;
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
  const raw = await kvGet(SUPPORT_KEY);
  return asThreads(raw);
}

async function writeKvThreads(threads: SupportThread[]) {
  return kvSet(SUPPORT_KEY, threads);
}

async function readKvSplit(): Promise<StoreData | null> {
  const metaRaw = await kvGet(META_KEY);
  if (!metaRaw || typeof metaRaw !== "object") return null;
  const meta = metaRaw as {
    users?: StoreData["users"];
    settings?: StoreData["settings"];
    businessIds?: string[];
    knowledgeGaps?: StoreData["knowledgeGaps"];
    otpChallenges?: StoreData["otpChallenges"];
    conversations?: StoreData["conversations"];
    leads?: StoreData["leads"];
  };
  if (!Array.isArray(meta.users) || !Array.isArray(meta.businessIds)) return null;
  const businesses: Business[] = [];
  const knowledge: KnowledgeItem[] = [];
  for (const id of meta.businessIds) {
    const row = await kvGet(bizKey(id));
    if (row && typeof row === "object") businesses.push(row as Business);
    const notes = await kvGet(knowKey(id));
    if (Array.isArray(notes)) {
      knowledge.push(...(notes as KnowledgeItem[]));
    }
  }
  return {
    users: meta.users,
    businesses,
    knowledge,
    leads: Array.isArray(meta.leads) ? meta.leads : [],
    conversations: Array.isArray(meta.conversations) ? meta.conversations : [],
    supportThreads: [],
    knowledgeGaps: Array.isArray(meta.knowledgeGaps) ? meta.knowledgeGaps : [],
    otpChallenges: Array.isArray(meta.otpChallenges) ? meta.otpChallenges : [],
    settings: meta.settings ?? { instructions: [] },
  };
}

async function readKvMonolith(): Promise<StoreData | null> {
  return asStore(await kvGet(KEY));
}

async function readKv(): Promise<StoreData | null> {
  const split = await readKvSplit();
  if (split) return split;
  return readKvMonolith();
}

async function writeKvSplit(data: StoreData) {
  const ids = data.businesses.map((b) => b.id);
  const meta = {
    users: data.users,
    settings: data.settings,
    businessIds: ids,
    knowledgeGaps: data.knowledgeGaps ?? [],
    otpChallenges: data.otpChallenges ?? [],
    conversations: data.conversations ?? [],
    leads: data.leads ?? [],
  };
  if (!(await kvSet(META_KEY, meta))) return false;
  const byBiz = new Map<string, KnowledgeItem[]>();
  for (const item of data.knowledge ?? []) {
    const list = byBiz.get(item.businessId) ?? [];
    list.push(item);
    byBiz.set(item.businessId, list);
  }
  for (const b of data.businesses) {
    if (!(await kvSet(bizKey(b.id), b))) return false;
    if (!(await kvSet(knowKey(b.id), byBiz.get(b.id) ?? []))) return false;
  }
  return true;
}

async function writeKv(data: StoreData) {
  if (await writeKvSplit(data)) return true;
  return kvSet(KEY, data);
}

async function readBlob(): Promise<StoreData | null> {
  const token = blobToken();
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
  } catch (err) {
    noteError(err instanceof Error ? `blob read: ${err.message}` : "blob read failed");
    return null;
  }
}

async function writeBlob(data: StoreData) {
  const token = blobToken();
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
  } catch (err) {
    noteError(err instanceof Error ? `blob write: ${err.message}` : "blob write failed");
    return false;
  }
}

function withThreads(data: StoreData | null, extra: SupportThread[] | null) {
  if (!data) return null;
  if (extra?.length) {
    data.supportThreads = mergeThreads(data.supportThreads, extra);
  }
  data.supportThreads = data.supportThreads ?? [];
  return data;
}

function pickNewer(a: StoreData | null, b: StoreData | null) {
  if (a && b) return persistRev(b) > persistRev(a) ? b : a;
  return a || b;
}

export async function readPersistedStore(): Promise<StoreData | null> {
  const extra = await readKvThreads();
  const fromKv = await readKv();
  const fromBlob = await readBlob();
  const chosen = pickNewer(fromKv, fromBlob);
  if (chosen) return withThreads(chosen, extra);
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
  lastError = "";
  const json = JSON.parse(JSON.stringify(data)) as StoreData;
  json.supportThreads = json.supportThreads ?? [];
  const kv = await writeKv(json);
  await writeKvThreads(json.supportThreads);
  const blob = await writeBlob(json);
  let local = false;
  try {
    if (!onVercel()) {
      writeFile(FILE_LOCAL, json);
      local = true;
    }
  } catch {
    /* read-only deploy */
  }
  try {
    writeFile(FILE_TMP, json);
  } catch {
    /* ignore */
  }
  if (kv || blob || local) return;
  throw new Error(lastError || "Could not persist shop data.");
}

export async function persistPing() {
  lastError = "";
  const creds = kvCreds();
  const blob = Boolean(blobToken());
  if (!creds && !blob) {
    return {
      ok: false,
      error: noteError("kv credentials missing"),
      env: persistEnvNames(),
    };
  }
  const mark = { t: Date.now() };
  const kvSetOk = creds ? await kvSet("sclxter:ping", mark) : false;
  const kvGot = creds ? await kvGet("sclxter:ping") : null;
  const kvOk =
    kvSetOk &&
    Boolean(kvGot) &&
    typeof kvGot === "object" &&
    (kvGot as { t?: number }).t === mark.t;
  let blobOk = false;
  if (blob) {
    try {
      const { put } = await import("@vercel/blob");
      await put("sclxter-ping.txt", String(mark.t), {
        access: "private",
        token: blobToken(),
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/plain",
      });
      blobOk = true;
    } catch (err) {
      noteError(err instanceof Error ? `blob write: ${err.message}` : "blob write failed");
    }
  }
  return {
    ok: kvOk || blobOk,
    kvOk,
    blobOk,
    error: lastError || null,
    env: persistEnvNames(),
  };
}

export function persistConfigured() {
  return Boolean(kvCreds() || blobToken());
}
