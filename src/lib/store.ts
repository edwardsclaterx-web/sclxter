import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ensureDemoIndustry, ensureNorthgateShop, seedIfEmpty } from "./seed";
import { DEMO_PUBLIC_ID } from "./seed";
import { normalizeInstructions } from "./instructions";
import type { Appearance, Business, StoreData } from "./types";
import { normalizeTheme } from "./widget-theme";

const DATA_PATH = join(process.cwd(), "data", "store.json");

const empty = (): StoreData => ({
  users: [],
  businesses: [],
  knowledge: [],
  leads: [],
  conversations: [],
  supportThreads: [],
  knowledgeGaps: [],
  settings: { instructions: normalizeInstructions(null) },
});

let cache: StoreData | null = null;
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => T): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function patchAppearance(a?: Partial<Appearance> | null): Appearance {
  return {
    assistantName: a?.assistantName || "Assistant",
    colour: a?.colour || "#ffffff",
    welcome: a?.welcome || "Ask about hours, prices, or how to book.",
    theme: normalizeTheme(a?.theme),
  };
}

function patchBusiness(b: Partial<Business> & { id: string }): Business {
  return {
    id: b.id,
    seq: typeof b.seq === "number" ? b.seq : 0,
    ownerId: b.ownerId ?? null,
    name: b.name ?? "",
    websiteUrl: b.websiteUrl ?? "",
    industry: b.industry ?? "",
    contactPhone: b.contactPhone ?? "",
    contactEmail: b.contactEmail ?? "",
    contactOther: b.contactOther ?? "",
    tone: b.tone ?? "plain",
    notepad: b.notepad ?? "",
    lastScanText: typeof b.lastScanText === "string" ? b.lastScanText : "",
    scannedAt: b.scannedAt ?? null,
    industryBriefing: b.industryBriefing ?? "",
    industryBriefingFor: b.industryBriefingFor ?? "",
    publicId: b.publicId ?? "",
    appearance: patchAppearance(b.appearance),
    widgetConnectedAt: b.widgetConnectedAt ?? null,
    createdAt: b.createdAt ?? new Date().toISOString(),
  };
}

function normalize(data: StoreData): StoreData {
  data.users = (data.users ?? []).map((u) => ({
    ...u,
    paidUntil: typeof u.paidUntil === "string" ? u.paidUntil : undefined,
  }));
  data.knowledge = data.knowledge ?? [];
  data.leads = (data.leads ?? []).map((l) => ({
    ...l,
    conversationId: l.conversationId ?? null,
  }));
  data.conversations = data.conversations ?? [];
  data.supportThreads = (data.supportThreads ?? []).map((t) => ({
    id: t.id,
    businessId: t.businessId,
    ownerId: t.ownerId,
    messages: Array.isArray(t.messages) ? t.messages : [],
    ownerUnread: typeof t.ownerUnread === "number" ? t.ownerUnread : 0,
    adminUnread: typeof t.adminUnread === "number" ? t.adminUnread : 0,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
  data.knowledgeGaps = (data.knowledgeGaps ?? []).map((g) => ({
    id: g.id,
    businessId: g.businessId,
    key: g.key,
    question: g.question,
    count: typeof g.count === "number" && g.count > 0 ? g.count : 1,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  }));
  data.settings = {
    instructions: normalizeInstructions(data.settings?.instructions),
  };
  data.businesses = (data.businesses ?? []).map((b) => patchBusiness(b));
  ensureDemoIndustry(data);

  const listed = data.businesses.filter(
    (b) => b.publicId !== DEMO_PUBLIC_ID && b.id !== "biz_northgate",
  );
  listed.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const claimed = new Set<number>();
  for (const b of listed) {
    if (b.seq >= 1 && !claimed.has(b.seq)) claimed.add(b.seq);
    else b.seq = 0;
  }
  let next = 1;
  for (const b of listed) {
    if (b.seq >= 1) continue;
    while (claimed.has(next)) next += 1;
    b.seq = next;
    claimed.add(next);
    next += 1;
  }
  return data;
}

function readDisk(): StoreData {
  if (!existsSync(DATA_PATH)) return empty();
  const raw = readFileSync(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw) as StoreData;
  return normalize({
    users: parsed.users ?? [],
    businesses: parsed.businesses ?? [],
    knowledge: parsed.knowledge ?? [],
    leads: parsed.leads ?? [],
    conversations: parsed.conversations ?? [],
    supportThreads: parsed.supportThreads ?? [],
    knowledgeGaps: parsed.knowledgeGaps ?? [],
    settings: parsed.settings ?? { instructions: [] },
  });
}

function writeDisk(data: StoreData) {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(normalize(data), null, 2));
}

export async function readStore(): Promise<StoreData> {
  return withLock(() => {
    if (!cache) {
      cache = readDisk();
      seedIfEmpty(cache);
      cache = normalize(cache);
      writeDisk(cache);
    } else {
      ensureNorthgateShop(cache);
      ensureDemoIndustry(cache);
      cache.supportThreads = cache.supportThreads ?? [];
      cache.knowledgeGaps = cache.knowledgeGaps ?? [];
    }
    return cache;
  });
}

export async function updateStore<T>(
  fn: (data: StoreData) => T,
): Promise<T> {
  return withLock(() => {
    if (!cache) {
      cache = readDisk();
      seedIfEmpty(cache);
      cache = normalize(cache);
    }
    ensureNorthgateShop(cache);
    cache.supportThreads = cache.supportThreads ?? [];
    cache.knowledgeGaps = cache.knowledgeGaps ?? [];
    const result = fn(cache);
    writeDisk(cache);
    return result;
  });
}
