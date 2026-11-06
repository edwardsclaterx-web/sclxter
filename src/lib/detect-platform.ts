export const PLATFORM_IDS = [
  "wix",
  "squarespace",
  "wordpress",
  "shopify",
  "webflow",
  "godaddy",
  "html",
  "google-sites",
  "framer",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export const PLATFORM_LABEL: Record<PlatformId, string> = {
  wix: "Wix",
  squarespace: "Squarespace",
  wordpress: "WordPress",
  shopify: "Shopify",
  webflow: "Webflow",
  godaddy: "GoDaddy",
  html: "Custom HTML",
  "google-sites": "Google Sites",
  framer: "Framer",
};

export function labelToPlatformId(name: string): PlatformId | null {
  const hit = (Object.entries(PLATFORM_LABEL) as [PlatformId, string][]).find(
    ([, label]) => label === name,
  );
  return hit ? hit[0] : null;
}

const FETCH_MS = 6_000;
const MAX_BYTES = 250_000;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function resolveDetectUrl(websiteUrl: string, origin: string) {
  const trimmed = websiteUrl.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function hostOf(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function headerBlob(headers: Record<string, string>) {
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
    .toLowerCase();
}

type Scores = Record<PlatformId, number>;

function emptyScores(): Scores {
  return {
    wix: 0,
    squarespace: 0,
    wordpress: 0,
    shopify: 0,
    webflow: 0,
    godaddy: 0,
    html: 0,
    "google-sites": 0,
    framer: 0,
  };
}

function bump(scores: Scores, id: PlatformId, n: number) {
  scores[id] += n;
}

export function scorePlatform(opts: {
  url: string;
  html: string;
  headers: Record<string, string>;
}): { id: PlatformId; score: number; label: string } | null {
  const scores = emptyScores();
  const host = hostOf(opts.url);
  const html = opts.html.toLowerCase();
  const heads = headerBlob(opts.headers);

  if (
    host.endsWith("wixsite.com") ||
    host.endsWith("wix.com") ||
    host.endsWith("editorx.io")
  ) {
    bump(scores, "wix", 12);
  }
  if (
    host.endsWith("squarespace.com") ||
    host.endsWith("sqsp.com") ||
    host.endsWith("sqspcdn.com")
  ) {
    bump(scores, "squarespace", 12);
  }
  if (host.endsWith("myshopify.com") || host.endsWith("shopify.com")) {
    bump(scores, "shopify", 12);
  }
  if (host.endsWith("webflow.io") || host.endsWith("webflow.com")) {
    bump(scores, "webflow", 12);
  }
  if (
    host.endsWith("godaddysites.com") ||
    host.endsWith("secureserver.net") ||
    host.endsWith("godaddy.com")
  ) {
    bump(scores, "godaddy", 12);
  }
  if (
    host.endsWith("wordpress.com") ||
    host.endsWith("wp.com") ||
    host.endsWith("wpengine.com")
  ) {
    bump(scores, "wordpress", 10);
  }
  if (host.endsWith("sites.google.com") || host.endsWith("google.com")) {
    if (html.includes("google-sites") || /\/sites\//.test(opts.url)) {
      bump(scores, "google-sites", 12);
    }
  }
  if (host.endsWith("framer.app") || host.endsWith("framer.website")) {
    bump(scores, "framer", 12);
  }

  if (
    /x-wix-|x-seen-by:.*wix|server:.*pep|x-wix-request-id/.test(heads) ||
    html.includes("static.wixstatic.com") ||
    html.includes("wix-thunderbolt") ||
    html.includes('generator" content="wix') ||
    (html.includes("wix.com") && html.includes("wix-thunderbolt"))
  ) {
    bump(scores, "wix", 8);
  }
  if (html.includes("parastorage") || html.includes("wixapps.net")) {
    bump(scores, "wix", 6);
  }

  if (
    /x-served-by:.*squarespace|server: squarespace|x-contextid/.test(heads) ||
    html.includes("static.squarespace.com") ||
    html.includes("squarespace-cdn.com") ||
    html.includes('generator" content="squarespace') ||
    html.includes("squarespace.com/static")
  ) {
    bump(scores, "squarespace", 8);
  }

  if (
    html.includes("/wp-content/") ||
    html.includes("/wp-includes/") ||
    html.includes("wp-json") ||
    html.includes("wordpress.org/?v=") ||
    html.includes('generator" content="wordpress') ||
    html.includes('rel="https://api.w.org/') ||
    (/x-powered-by: wp engine/.test(heads) && html.includes("wp-content"))
  ) {
    bump(scores, "wordpress", 8);
  }

  if (
    /x-shopify-|x-sorting-hat-|x-shopid/.test(heads) ||
    html.includes("cdn.shopify.com") ||
    html.includes("shopify.theme") ||
    html.includes("myshopify.com") ||
    html.includes("shopify-section")
  ) {
    bump(scores, "shopify", 8);
  }

  if (
    html.includes("data-wf-site") ||
    html.includes("data-wf-domain") ||
    html.includes("webflow.js") ||
    html.includes("assets.website-files.com") ||
    html.includes("uploads-ssl.webflow.com") ||
    html.includes('generator" content="webflow')
  ) {
    bump(scores, "webflow", 8);
  }

  if (
    /x-godaddy|x-nexcess-cluster|server:.*godaddy/.test(heads) ||
    html.includes("wsimg.com") ||
    html.includes("godaddy.com/websites") ||
    html.includes("gd-website") ||
    html.includes("websitebuilder.com") ||
    html.includes("godaddy website builder")
  ) {
    bump(scores, "godaddy", 8);
  }

  if (
    html.includes("sites.google.com") ||
    html.includes("google-sites") ||
    html.includes("/_/scs/sbg/")
  ) {
    bump(scores, "google-sites", 7);
  }

  if (
    html.includes("framerusercontent.com") ||
    html.includes("framer.com/m/") ||
    html.includes("data-framer-root")
  ) {
    bump(scores, "framer", 8);
  }

  const ranked = (Object.entries(scores) as [PlatformId, number][])
    .filter(([id]) => id !== "html")
    .sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  if (top && top[1] >= 6) {
    return { id: top[0], score: top[1], label: PLATFORM_LABEL[top[0]] };
  }
  if (opts.html.trim().length > 40) {
    return { id: "html", score: 1, label: PLATFORM_LABEL.html };
  }
  return null;
}

export async function fetchSiteFingerprint(url: string): Promise<{
  url: string;
  html: string;
  headers: Record<string, string>;
} | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": BROWSER_UA,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "accept-language": "en-GB,en;q=0.8",
      },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (type.includes("image/") || type.includes("video/") || type.includes("pdf")) {
      return null;
    }
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    const raw = await res.text();
    return {
      url: res.url || url,
      html: raw.slice(0, MAX_BYTES),
      headers,
    };
  } catch {
    return null;
  }
}

export async function detectSitePlatform(url: string) {
  const page = await fetchSiteFingerprint(url);
  if (!page) return { platform: null as PlatformId | null, checkedUrl: url };
  const hit = scorePlatform(page);
  return {
    platform: hit?.id ?? null,
    label: hit?.label ?? null,
    checkedUrl: page.url,
  };
}
