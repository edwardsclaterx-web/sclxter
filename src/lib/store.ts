import { ensureDemoIndustry, ensureNorthgateShop, seedIfEmpty } from "./seed";
import { DEMO_PUBLIC_ID } from "./seed";
import { normalizeInstructions } from "./instructions";
import { readPersistedStore, writePersistedStore } from "./persist";
import type { Appearance, Business, StoreData } from "./types";
import { normalizeTheme } from "./widget-theme";

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

function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = queue.then(() => fn(), () => fn());
  queue = Promise.resolve(run).then(
    () => undefined,
    () => undefined,
  );
  return Promise.resolve(run);
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
    setupPaid: u.setupPaid === true,
    stripeCustomerId:
      typeof u.stripeCustomerId === "string" ? u.stripeCustomerId : undefined,
    processedCheckoutIds: Array.isArray(u.processedCheckoutIds)
      ? u.processedCheckoutIds.filter((id) => typeof id === "string")
      : undefined,
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

function hydrate(parsed: StoreData | null): StoreData {
  const data = parsed ?? empty();
  return normalize({
    users: data.users ?? [],
    businesses: data.businesses ?? [],
    knowledge: data.knowledge ?? [],
    leads: data.leads ?? [],
    conversations: data.conversations ?? [],
    supportThreads: data.supportThreads ?? [],
    knowledgeGaps: data.knowledgeGaps ?? [],
    settings: data.settings ?? { instructions: [] },
  });
}

async function loadStore(): Promise<StoreData> {
  let data = hydrate(await readPersistedStore());
  seedIfEmpty(data);
  ensureNorthgateShop(data);
  ensureDemoIndustry(data);
  data.supportThreads = data.supportThreads ?? [];
  data.knowledgeGaps = data.knowledgeGaps ?? [];
  data = normalize(data);
  cache = data;
  return data;
}

export async function readStore(): Promise<StoreData> {
  return withLock(() => loadStore());
}

export async function updateStore<T>(
  fn: (data: StoreData) => T,
): Promise<T> {
  return withLock(async () => {
    const data = await loadStore();
    const result = fn(data);
    cache = data;
    await writePersistedStore(normalize(data));
    return result;
  });
}
