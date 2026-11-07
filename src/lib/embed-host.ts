import { isDemoBusiness } from "./access";
import { businessHasLiveAccess } from "./billing";
import { CLARIFY } from "./chat-copy";
import type { Business, StoreData } from "./types";

const SITE_PUBLIC_ID = "sclxter";

export { CLARIFY };
export const TRY_AGAIN = CLARIFY;
export const EMBED_OFF_SITE = "This assistant is not available on this site.";
export const EMBED_UNAVAILABLE = "This assistant is unavailable.";

export function parsePageOrigin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function hostsForWebsite(websiteUrl: string, appOrigin: string): Set<string> {
  const hosts = new Set<string>();
  const trimmed = websiteUrl.trim();
  if (!trimmed) return hosts;
  if (trimmed.startsWith("/")) {
    try {
      hosts.add(new URL(appOrigin).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
    return hosts;
  }
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const h = u.hostname.toLowerCase();
    if (!h) return hosts;
    hosts.add(h);
    if (h.startsWith("www.")) hosts.add(h.slice(4));
    else hosts.add(`www.${h}`);
  } catch {
    /* ignore */
  }
  return hosts;
}

export function pageMatchesWebsite(
  pageOrigin: string | null,
  websiteUrl: string,
  appOrigin: string,
): boolean {
  const origin = parsePageOrigin(pageOrigin);
  if (!origin) return false;
  const allowed = hostsForWebsite(websiteUrl, appOrigin);
  if (!allowed.size) return false;
  try {
    return allowed.has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function embedPageAllowed(opts: {
  publicId: string;
  websiteUrl: string;
  pageOrigin: string | null;
  appOrigin: string;
  demo: boolean;
}): boolean {
  if (opts.publicId === SITE_PUBLIC_ID) {
    const origin = parsePageOrigin(opts.pageOrigin);
    return !origin || origin === opts.appOrigin;
  }
  if (opts.demo) {
    return parsePageOrigin(opts.pageOrigin) === opts.appOrigin;
  }
  return pageMatchesWebsite(opts.pageOrigin, opts.websiteUrl, opts.appOrigin);
}

export function readEmbedFrom(
  request: Request,
  extra?: { from?: unknown },
): string | null {
  const url = new URL(request.url);
  const q = url.searchParams.get("from");
  const body =
    typeof extra?.from === "string" ? extra.from : null;
  return parsePageOrigin(q) || parsePageOrigin(body);
}

export function appOriginFromRequest(request: Request): string {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) return `${url.protocol}//${host}`;
  return url.origin;
}

export function publicEmbedGate(
  request: Request,
  business: Business,
  data: StoreData,
  pageOrigin: string | null,
): { ok: true } | { ok: false; status: number; error: string } {
  if (!businessHasLiveAccess(business, data)) {
    return { ok: false, status: 403, error: EMBED_UNAVAILABLE };
  }
  const appOrigin = appOriginFromRequest(request);
  const allowed = embedPageAllowed({
    publicId: business.publicId,
    websiteUrl: business.websiteUrl,
    pageOrigin,
    appOrigin,
    demo: isDemoBusiness(business),
  });
  if (!allowed) {
    return { ok: false, status: 403, error: EMBED_OFF_SITE };
  }
  return { ok: true };
}

export function corsAllow(res: Response, origin?: string | null) {
  res.headers.set("Access-Control-Allow-Origin", origin || "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  return res;
}
