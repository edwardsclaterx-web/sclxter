import "server-only";

import type Stripe from "stripe";
import { applyPaidMonths } from "./billing";
import { markPromoCodeUsed } from "./free-codes";
import { coverCheckoutLines, SETUP_PENCE } from "./prices";
import { getStripe, stripeConfigured } from "./stripe";
import { updateStore } from "./store";
import type { User } from "./types";

const SESSION_KEEP = 40;

function originFromRequest(request: Request) {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "http";
  if (host) return `${proto}://${host}`;
  return url.origin;
}

export function checkoutReady() {
  return stripeConfigured();
}

export async function createCoverCheckout(
  user: User,
  months: number,
  request: Request,
  promo?: { code: string; percentOff: number },
) {
  if (!checkoutReady()) {
    throw new Error("Stripe is not configured on this server.");
  }
  const n = Math.floor(Number(months) || 0);
  const preview = applyPaidMonths(user.paidUntil, n);
  if (n < 1 || n > 12 || preview.applied !== n) {
    const err = new Error(
      preview.applied < 1 && n >= 1
        ? "You already have the maximum 12 months of cover."
        : "Choose between 1 and 12 months, within the 12-month cap.",
    );
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  const { includeSetup, items } = coverCheckoutLines(
    user.setupPaid,
    n,
    promo?.percentOff,
  );
  const stripe = getStripe();
  let customerId = user.stripeCustomerId;
  if (customerId) {
    try {
      const existing = await stripe.customers.retrieve(customerId);
      if ("deleted" in existing && existing.deleted) customerId = undefined;
    } catch {
      customerId = undefined;
    }
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await updateStore((data) => {
      const row = data.users.find((u) => u.id === user.id);
      if (row) row.stripeCustomerId = customerId;
    });
  }

  const line_items = items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "gbp" as const,
      unit_amount: item.unit_amount,
      product_data: { name: item.name },
    },
  }));

  const origin = originFromRequest(request);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: user.id,
    success_url: `${origin}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/buy?cancelled=1`,
    line_items,
    metadata: {
      userId: user.id,
      months: String(n),
      includeSetup: includeSetup ? "1" : "0",
      ...(promo?.code
        ? { promoCode: promo.code, percentOff: String(promo.percentOff) }
        : {}),
    },
    managed_payments: { enabled: false },
  } as Parameters<Stripe["checkout"]["sessions"]["create"]>[0]);
  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }
  const listed = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 20,
  });
  const chargedSetup = listed.data.some(
    (row) =>
      row.price?.unit_amount === SETUP_PENCE ||
      /\bsetup\b/i.test(row.description || ""),
  );
  if (!includeSetup && chargedSetup) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    throw new Error("Checkout wrongly included the setup fee.");
  }
  return {
    url: session.url,
    includeSetup,
    lineItems: listed.data.map((row) => ({
      description: row.description || "",
      quantity: row.quantity ?? 1,
      unitAmount: row.price?.unit_amount ?? null,
    })),
  };
}

export async function applyPaidCheckoutSession(sessionId: string, userId?: string) {
  if (!sessionId || !checkoutReady()) {
    return { ok: false as const, reason: "missing" };
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.mode !== "payment") {
    return { ok: false as const, reason: "mode" };
  }
  if (session.payment_status !== "paid") {
    return { ok: false as const, reason: "unpaid" };
  }
  const metaUser = session.metadata?.userId || session.client_reference_id || "";
  if (userId && metaUser && metaUser !== userId) {
    return { ok: false as const, reason: "user" };
  }
  const months = Math.floor(Number(session.metadata?.months) || 0);
  const includeSetup = session.metadata?.includeSetup === "1";
  if (months < 1) {
    return { ok: false as const, reason: "months" };
  }

  const promoCode = session.metadata?.promoCode || "";

  const result = await updateStore((data) => {
    const row = data.users.find((u) => u.id === metaUser);
    if (!row) return { applied: 0, already: false };
    const seen = row.processedCheckoutIds ?? [];
    if (seen.includes(session.id)) {
      return {
        applied: 0,
        already: true,
        months,
        paidUntil: row.paidUntil ?? null,
      };
    }
    const next = applyPaidMonths(row.paidUntil, months);
    row.paidUntil = next.paidUntil ?? undefined;
    row.setupPaid = row.setupPaid === true || includeSetup;
    row.processedCheckoutIds = [...seen, session.id].slice(-SESSION_KEEP);
    return {
      applied: next.applied,
      already: false,
      months,
      paidUntil: row.paidUntil,
    };
  });

  if (promoCode && metaUser) {
    await markPromoCodeUsed(
      metaUser,
      promoCode,
      session.customer_details?.email || session.customer_email || undefined,
    );
  }
  return { ok: true as const, months, ...result };
}
