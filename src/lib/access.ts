import "server-only";

import { isOwnerEmail } from "./owner-auth";
import { DEMO_PUBLIC_ID } from "./seed";
import {
  NORTHGATE_BIZ_ID,
  NORTHGATE_USER_ID,
  isNorthgateLogin,
} from "./northgate";
import { readStore, updateStore } from "./store";
import { id, publicId } from "./ids";
import type { Business, ClientBusiness, StoreData, User } from "./types";
import { DEFAULT_WIDGET_THEME, normalizeTheme } from "./widget-theme";

export function isAdmin(user: User) {
  return isOwnerEmail(user.email);
}

export function isDemoBusiness(b: Business) {
  return b.publicId === DEMO_PUBLIC_ID || b.id === "biz_northgate";
}

export function listedBusinesses(data: StoreData) {
  return data.businesses.filter((b) => !isDemoBusiness(b));
}

export function nextJoinSeq(data: StoreData) {
  const seqs = listedBusinesses(data).map((b) => b.seq || 0);
  return (seqs.length ? Math.max(...seqs) : 0) + 1;
}

export function nextConversationSeq(data: StoreData, businessId: string) {
  const seqs = data.conversations
    .filter((c) => c.businessId === businessId)
    .map((c) => c.seq || 0);
  return (seqs.length ? Math.max(...seqs) : 0) + 1;
}

export function newBusinessFields(
  ownerId: string | null,
  seq: number,
): Omit<Business, "id" | "createdAt"> & { appearance: Business["appearance"] } {
  return {
    seq,
    ownerId,
    name: "",
    websiteUrl: "",
    industry: "",
    contactPhone: "",
    contactEmail: "",
    contactOther: "",
    tone: "plain",
    notepad: "",
    lastScanText: "",
    scannedAt: null,
    industryBriefing: "",
    industryBriefingFor: "",
    publicId: publicId(),
    appearance: {
      assistantName: "Assistant",
      colour: "#ffffff",
      welcome: "Ask about hours, prices, or how to book.",
      theme: { ...DEFAULT_WIDGET_THEME },
    },
    widgetConnectedAt: null,
  };
}

export function businessForUser(data: StoreData, user: User): Business | null {
  if (isNorthgateLogin(user.email) || user.id === NORTHGATE_USER_ID) {
    const demo = data.businesses.find(
      (b) => b.publicId === DEMO_PUBLIC_ID || b.id === NORTHGATE_BIZ_ID,
    );
    if (demo) return demo;
  }
  const listed = listedBusinesses(data);
  const mine = listed.filter((b) => {
    if (b.ownerId === user.id) return true;
    const owner = data.users.find((u) => u.id === b.ownerId);
    return owner?.email === user.email;
  });
  mine.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return mine[0] ?? null;
}

export async function getOwnedBusiness(user: User): Promise<Business | null> {
  const data = await readStore();
  return businessForUser(data, user);
}

export async function showBillingNav(user: User): Promise<boolean> {
  if (isAdmin(user)) return false;
  return true;
}

export async function getBusinessBySeq(seq: number): Promise<Business | null> {
  const data = await readStore();
  return listedBusinesses(data).find((b) => b.seq === seq) ?? null;
}

export async function resolveBusiness(
  user: User,
  seq?: number | null,
): Promise<Business | null> {
  if (isAdmin(user)) {
    if (typeof seq === "number" && seq > 0) {
      return getBusinessBySeq(seq);
    }
    return null;
  }
  return getOwnedBusiness(user);
}

export async function createBusinessForSignup(user: User): Promise<Business> {
  return updateStore((data) => {
    const existing = businessForUser(data, user);
    if (existing) {
      if (!existing.ownerId) existing.ownerId = user.id;
      return existing;
    }
    const now = new Date().toISOString();
    const biz: Business = {
      id: id("biz"),
      createdAt: now,
      ...newBusinessFields(user.id, nextJoinSeq(data)),
    };
    data.businesses.push(biz);
    return biz;
  });
}

export function toClientBusiness(
  b: Business,
  opts: { admin: boolean; ownerEmail?: string },
): ClientBusiness {
  const base: ClientBusiness = {
    name: b.name,
    websiteUrl: b.websiteUrl,
    industry: b.industry,
    contactPhone: b.contactPhone,
    contactEmail: b.contactEmail,
    contactOther: b.contactOther,
    tone: b.tone,
    notepad: b.notepad,
    scannedAt: b.scannedAt,
    publicId: b.publicId,
    createdAt: b.createdAt,
    theme: normalizeTheme(b.appearance?.theme),
  };
  if (opts.admin) {
    base.seq = b.seq;
    base.ownerEmail = opts.ownerEmail ?? "";
  }
  return base;
}
