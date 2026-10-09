import "server-only";

import { isOwnerEmail } from "./owner-auth";
import { DEMO_PUBLIC_ID } from "./seed";
import { readStore, updateStore } from "./store";
import { id, publicId } from "./ids";
import type { Business, ClientBusiness, StoreData, User } from "./types";

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
    scannedAt: null,
    publicId: publicId(),
    appearance: {
      assistantName: "Assistant",
      colour: "#ffffff",
      welcome: "Ask about hours, prices, or how to book.",
    },
    widgetConnectedAt: null,
  };
}

export async function getOwnedBusiness(user: User): Promise<Business | null> {
  const data = await readStore();
  return (
    listedBusinesses(data).find((b) => b.ownerId === user.id) ?? null
  );
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
    const existing = listedBusinesses(data).find((b) => b.ownerId === user.id);
    if (existing) return existing;
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
  };
  if (opts.admin) {
    base.seq = b.seq;
    base.ownerEmail = opts.ownerEmail ?? "";
  }
  return base;
}
