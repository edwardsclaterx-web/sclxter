import "server-only";

import { isOwnerEmail } from "./owner-auth";
import { isDemoBusiness } from "./access";
import type { Business, StoreData, User } from "./types";

export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_COVER_MONTHS = 12;
export const MAX_COVER_MS = MAX_COVER_MONTHS * MONTH_MS;

export type ApplyPaidMonthResult = {
  applied: boolean;
  paidUntil: string | null;
};

function asIso(ms: number) {
  return new Date(ms).toISOString();
}

function currentEndMs(current?: string | null) {
  if (!current) return NaN;
  const t = Date.parse(current);
  return Number.isFinite(t) ? t : NaN;
}

/** Stripe (later) and signup renew both call this. Adds one 30-day month onto remaining cover, or from now if lapsed. Refuses if that would put remaining cover past 12 months from now. */
export function applyPaidMonth(
  current?: string | null,
  now = Date.now(),
): ApplyPaidMonthResult {
  const end = currentEndMs(current);
  const kept = Number.isFinite(end) ? asIso(end) : null;
  const cap = now + MAX_COVER_MS;
  const base = Number.isFinite(end) && end > now ? end : now;
  const next = base + MONTH_MS;
  if (next > cap) {
    return { applied: false, paidUntil: kept };
  }
  return { applied: true, paidUntil: asIso(next) };
}

export function extendPaidUntil(current?: string | null, now = Date.now()) {
  return applyPaidMonth(current, now);
}

export function applyPaidMonths(
  current?: string | null,
  count = 1,
  now = Date.now(),
) {
  const n = Math.min(
    MAX_COVER_MONTHS,
    Math.max(0, Math.floor(Number(count) || 0)),
  );
  let paidUntil = current ?? null;
  let applied = 0;
  for (let i = 0; i < n; i += 1) {
    const next = applyPaidMonth(paidUntil, now);
    if (!next.applied || !next.paidUntil) break;
    paidUntil = next.paidUntil;
    applied += 1;
  }
  return { applied, paidUntil, refused: n - applied };
}

export function userHasLiveAccess(user: User | null | undefined) {
  if (!user) return false;
  if (isOwnerEmail(user.email)) return true;
  if (!user.paidUntil) return false;
  const t = Date.parse(user.paidUntil);
  return Number.isFinite(t) && t > Date.now();
}

export function businessHasLiveAccess(business: Business, data: StoreData) {
  if (isDemoBusiness(business)) return true;
  if (!business.ownerId) return false;
  const owner = data.users.find((u) => u.id === business.ownerId);
  if (!owner) return false;
  return userHasLiveAccess(owner);
}
