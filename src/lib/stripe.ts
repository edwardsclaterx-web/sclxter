import "server-only";

import Stripe from "stripe";
import { loadSecrets } from "./secrets";

let client: Stripe | null = null;

export const SETUP_PENCE = 29999;
export const MONTH_PENCE = 7499;

export function stripeConfigured() {
  loadSecrets();
  const secret = process.env.STRIPE_SECRET_KEY || "";
  return secret.startsWith("sk_test_") || secret.startsWith("sk_live_");
}

export function getStripe(): Stripe {
  loadSecrets();
  const secret = process.env.STRIPE_SECRET_KEY || "";
  if (!secret.startsWith("sk_test_") && !secret.startsWith("sk_live_")) {
    throw new Error("Stripe is not configured on this server.");
  }
  if (!client) {
    client = new Stripe(secret);
  }
  return client;
}
