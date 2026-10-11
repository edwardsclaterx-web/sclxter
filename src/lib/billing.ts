import "server-only";

import { isOwnerEmail } from "./owner-auth";
import { isDemoBusiness } from "./access";
import type { Business, StoreData, User } from "./types";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function extendPaidUntil(current?: string | null) {
  const now = Date.now();
  const existing = current ? Date.parse(current) : NaN;
  const base = Number.isFinite(existing) && existing > now ? existing : now;
  return new Date(base + MONTH_MS).toISOString();
}

export function userHasLiveAccess(user: User | null | undefined) {
  if (!user) return false;
  if (isOwnerEmail(user.email)) return true;
  if (!user.paidUntil) return true;
  const t = Date.parse(user.paidUntil);
  return Number.isFinite(t) && t > Date.now();
}

export function businessHasLiveAccess(business: Business, data: StoreData) {
  if (isDemoBusiness(business)) return true;
  if (!business.ownerId) return true;
  const owner = data.users.find((u) => u.id === business.ownerId);
  if (!owner) return false;
  return userHasLiveAccess(owner);
}
