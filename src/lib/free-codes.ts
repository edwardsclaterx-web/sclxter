import "server-only";

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isShowcaseBusiness, listedBusinesses } from "./access";
import { applyPaidMonths } from "./billing";
import {
  persistConfigured,
  persistKvDel,
  persistKvGet,
  persistKvSet,
  persistKvSetNx,
} from "./persist";
import { isOwnerUser } from "./owner-auth";
import { updateStore } from "./store";
import type { Business, User } from "./types";

const INDEX_KEY = "sclxter:codes";
const FILE_LOCAL = join(process.cwd(), "data", "codes.json");
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type FreeCode = {
  code: string;
  months: number;
  createdAt: string;
  usedAt?: string;
  usedByUserId?: string;
  usedByBusinessId?: string;
  usedByBusinessName?: string;
};

type LocalBag = { ids: string[]; byCode: Record<string, FreeCode> };

function fail(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function codeKey(code: string) {
  return `sclxter:code:${code}`;
}
function claimKey(code: string) {
  return `sclxter:code-claim:${code}`;
}

export function normalizeFreeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function chunk4() {
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function mintFreeCode() {
  return `SCLX-${chunk4()}-${chunk4()}`;
}

function readLocal(): LocalBag {
  if (!existsSync(FILE_LOCAL)) return { ids: [], byCode: {} };
  try {
    const parsed = JSON.parse(readFileSync(FILE_LOCAL, "utf8")) as LocalBag;
    if (!parsed || typeof parsed !== "object") return { ids: [], byCode: {} };
    return {
      ids: Array.isArray(parsed.ids)
        ? parsed.ids.filter((x) => typeof x === "string")
        : [],
      byCode:
        parsed.byCode && typeof parsed.byCode === "object" ? parsed.byCode : {},
    };
  } catch {
    return { ids: [], byCode: {} };
  }
}

function writeLocal(bag: LocalBag) {
  if (persistConfigured()) return;
  mkdirSync(dirname(FILE_LOCAL), { recursive: true });
  writeFileSync(FILE_LOCAL, JSON.stringify(bag), { mode: 0o600 });
}

function asCode(raw: unknown): FreeCode | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as FreeCode;
  if (typeof row.code !== "string" || !row.code) return null;
  const months = Number(row.months);
  if (!Number.isFinite(months) || months < 1 || months > 12) return null;
  return {
    code: row.code,
    months: Math.floor(months),
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : new Date().toISOString(),
    usedAt: typeof row.usedAt === "string" ? row.usedAt : undefined,
    usedByUserId:
      typeof row.usedByUserId === "string" ? row.usedByUserId : undefined,
    usedByBusinessId:
      typeof row.usedByBusinessId === "string"
        ? row.usedByBusinessId
        : undefined,
    usedByBusinessName:
      typeof row.usedByBusinessName === "string"
        ? row.usedByBusinessName
        : undefined,
  };
}

async function readIndex(): Promise<string[]> {
  if (persistConfigured()) {
    const raw = await persistKvGet(INDEX_KEY);
    if (Array.isArray(raw)) {
      return raw.filter((x): x is string => typeof x === "string");
    }
  }
  return readLocal().ids;
}

async function writeIndex(ids: string[]) {
  const unique = [...new Set(ids)];
  if (persistConfigured()) {
    const ok = await persistKvSet(INDEX_KEY, unique);
    if (!ok) throw new Error("Could not save codes.");
  }
  const bag = readLocal();
  bag.ids = unique;
  writeLocal(bag);
}

async function readCode(code: string): Promise<FreeCode | null> {
  if (persistConfigured()) {
    const row = asCode(await persistKvGet(codeKey(code)));
    if (row) return row;
  }
  return asCode(readLocal().byCode[code] ?? null);
}

async function writeCode(row: FreeCode) {
  if (persistConfigured()) {
    const ok = await persistKvSet(codeKey(row.code), row);
    if (!ok) throw new Error("Could not save codes.");
  }
  const bag = readLocal();
  bag.byCode[row.code] = row;
  if (!bag.ids.includes(row.code)) bag.ids.push(row.code);
  writeLocal(bag);
}

export async function listFreeCodes(): Promise<FreeCode[]> {
  const ids = await readIndex();
  const rows: FreeCode[] = [];
  for (const id of ids) {
    const row = await readCode(id);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return rows;
}

export async function createFreeCode(months: number): Promise<FreeCode> {
  const n = Math.floor(Number(months) || 0);
  if (n < 1 || n > 12) {
    throw fail("Choose between 1 and 12 months.", 400);
  }
  for (let i = 0; i < 12; i += 1) {
    const code = mintFreeCode();
    if (await readCode(code)) continue;
    const row: FreeCode = {
      code,
      months: n,
      createdAt: new Date().toISOString(),
    };
    if (persistConfigured()) {
      const created = await persistKvSetNx(codeKey(code), row);
      if (!created) continue;
      const bag = readLocal();
      bag.byCode[code] = row;
      writeLocal(bag);
    } else {
      await writeCode(row);
    }
    const ids = await readIndex();
    if (!ids.includes(code)) {
      ids.push(code);
      await writeIndex(ids);
    }
    return row;
  }
  throw new Error("Could not mint a unique code.");
}

export async function deleteUnusedFreeCode(codeRaw: string) {
  const code = normalizeFreeCode(codeRaw);
  const row = await readCode(code);
  if (!row) throw fail("That code is not valid.", 404);
  if (row.usedAt) throw fail("Used codes cannot be deleted.", 409);
  if (persistConfigured()) {
    await persistKvDel(codeKey(code));
    await persistKvDel(claimKey(code));
  }
  const bag = readLocal();
  delete bag.byCode[code];
  bag.ids = bag.ids.filter((id) => id !== code);
  writeLocal(bag);
  await writeIndex((await readIndex()).filter((id) => id !== code));
}

function shopForUser(user: User, businesses: Business[]) {
  const mine = businesses.filter((b) => b.ownerId === user.id);
  mine.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return mine[0] ?? null;
}

export async function redeemFreeCode(user: User, codeRaw: string) {
  const code = normalizeFreeCode(codeRaw);
  if (!/^SCLX-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) {
    throw fail("That code is not valid.", 400);
  }
  const row = await readCode(code);
  if (!row) throw fail("That code is not valid.", 400);
  if (row.usedAt) throw fail("That code has already been used.", 409);
  const preview = applyPaidMonths(user.paidUntil, row.months);
  if (preview.applied !== row.months) {
    throw fail("This code would take you past 12 months of cover.", 409);
  }

  let claimed = true;
  if (persistConfigured()) {
    claimed = await persistKvSetNx(claimKey(code), user.id);
  } else {
    const current = readLocal().byCode[code];
    if (!current || current.usedAt) claimed = false;
  }
  if (!claimed) throw fail("That code has already been used.", 409);

  try {
    const applied = await updateStore((data) => {
      const owner = data.users.find((u) => u.id === user.id);
      if (!owner) return null;
      const next = applyPaidMonths(owner.paidUntil, row.months);
      owner.paidUntil = next.paidUntil ?? undefined;
      owner.setupPaid = true;
      const shop = shopForUser(owner, data.businesses);
      return {
        paidUntil: owner.paidUntil ?? null,
        businessId: shop?.id ?? "",
        businessName: shop?.name || owner.email,
      };
    });
    if (!applied) throw new Error("Could not save.");
    const used: FreeCode = {
      ...row,
      usedAt: new Date().toISOString(),
      usedByUserId: user.id,
      usedByBusinessId: applied.businessId || undefined,
      usedByBusinessName: applied.businessName,
    };
    await writeCode(used);
    return {
      code: used.code,
      months: used.months,
      paidUntil: applied.paidUntil,
    };
  } catch (err) {
    if (persistConfigured()) await persistKvDel(claimKey(code));
    throw err;
  }
}

export async function purgeListedOwner(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) throw fail("Use the account email.", 400);
  return updateStore((data) => {
    const owner = data.users.find((u) => u.email === email);
    if (!owner) throw fail("That account was not found.", 404);
    if (isOwnerUser(owner)) throw fail("That account cannot be removed.", 409);
    const shops = listedBusinesses(data).filter((b) => b.ownerId === owner.id);
    if (!shops.length) {
      const extra = data.businesses.filter((b) => b.ownerId === owner.id);
      if (extra.some(isShowcaseBusiness)) {
        throw fail("That account cannot be removed.", 409);
      }
    }
    const ids = new Set(
      data.businesses.filter((b) => b.ownerId === owner.id).map((b) => b.id),
    );
    if ([...ids].some((id) => {
      const b = data.businesses.find((row) => row.id === id);
      return b ? isShowcaseBusiness(b) : false;
    })) {
      throw fail("That account cannot be removed.", 409);
    }
    data.users = data.users.filter((u) => u.id !== owner.id);
    data.businesses = data.businesses.filter((b) => b.ownerId !== owner.id);
    data.knowledge = data.knowledge.filter((k) => !ids.has(k.businessId));
    data.leads = data.leads.filter((l) => !ids.has(l.businessId));
    data.conversations = data.conversations.filter(
      (c) => !ids.has(c.businessId),
    );
    data.supportThreads = (data.supportThreads ?? []).filter(
      (t) => !ids.has(t.businessId),
    );
    data.knowledgeGaps = (data.knowledgeGaps ?? []).filter(
      (g) => !ids.has(g.businessId),
    );
    return { email: owner.email, removed: ids.size };
  });
}
