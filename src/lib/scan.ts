import { spawn } from "node:child_process";
import { load } from "cheerio";

const MAX_BYTES = 250_000;
const MAX_DOWNLOAD = 1_500_000;
const MAX_BLOCKS = 140;
const MAX_BODY = 12_000;
const FETCH_MS = 5_000;
const SCAN_MS = 26_000;
const BATCH = 4;
const ARCHIVE_BATCH = 2;
const MAX_ARCHIVE = 8;
const FULL_IF_AT_MOST = 40;
const MAX_DISCOVER = 400;
const DISCOVER_FETCH = 24;
const MAX_SITEMAPS = 8;
const INDEX_SUMMARY = 280;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const PATH_GUESSES = [
  "/",
  "/about",
  "/about-us",
  "/aboutus",
  "/services",
  "/our-services",
  "/cuts",
  "/menu",
  "/prices",
  "/pricing",
  "/price-list",
  "/contact",
  "/contact-us",
  "/find-us",
  "/location",
  "/book",
  "/booking",
  "/bookings",
  "/online-bookings",
  "/hours",
  "/opening-times",
  "/visit",
  "/team",
  "/staff",
  "/our-story",
  "/blog",
  "/articles",
  "/posts",
  "/news",
  "/journal",
  "/running",
  "/running/",
  "/running-tools",
  "/running-tools/",
  "/tools",
  "/apps",
  "/privacy",
  "/privacy-policy",
];

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveWebsiteUrl(websiteUrl: string, origin: string) {
  const trimmed = websiteUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  if (isHttpUrl(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function siteHost(hostname: string) {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function sameSite(a: URL, b: URL) {
  return siteHost(a.hostname) === siteHost(b.hostname);
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

const JUNK_PATH =
  /(^|\/)(reviews?|testimonials?|ratings?|comments?|feedback|trustpilot)(\/|$)/i;

const SKIP_FILE =
  /\.(pdf|jpe?g|png|gif|webp|svg|ico|css|js|mjs|map|json|xml|txt|mp4|mp3|zip|docx?|xlsx?|woff2?|ttf|otf|webmanifest)$/i;

const INFRA_PATH = /^\/(\.well-known|cdn-cgi)(\/|$)/i;

const USEFUL_PATH: Array<{ re: RegExp; rank: number }> = [
  { re: /about|our-story|who-we-are/, rank: 1 },
  { re: /(^|\/)(blog|articles?|posts?|journal|news|running|writing)(\/|$)/, rank: 2 },
  { re: /service|cuts?|menu|treatments?/, rank: 3 },
  { re: /pric|cost|fees?/, rank: 4 },
  { re: /contact|find-us|location|visit/, rank: 5 },
  { re: /book|walk-?in|hours|opening/, rank: 6 },
  { re: /staff|team|barbers?/, rank: 7 },
  { re: /tool|apps?/, rank: 8 },
  { re: /polic|terms/, rank: 9 },
];

export function isJunkPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return JUNK_PATH.test(path) || INFRA_PATH.test(path);
}

export function pageRank(url: string, startPath: string) {
  let path = "/";
  try {
    path = new URL(url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return 50;
  }
  if (isJunkPath(path) || SKIP_FILE.test(path)) return 1000;
  const start = startPath.replace(/\/+$/, "") || "/";
  if (path === "/" || path === start) return 0;
  const leaf = path.toLowerCase();
  for (const row of USEFUL_PATH) {
    if (row.re.test(leaf)) return row.rank;
  }
  return 20;
}

function tokenSoup(value: string) {
  return value.replace(/[-_]/g, " ").toLowerCase();
}

function looksJunkLabel(value: string) {
  const s = tokenSoup(value);
  return /\b(reviews?|testimonials?|ratings?|comments?|feedback|what customers say|google reviews?)\b/.test(
    s,
  );
}

function isFluffBit(text: string) {
  const s = text.toLowerCase().replace(/[.:]+$/g, "").trim();
  if (s.length < 2) return true;
  if (
    /^(home|menu|skip to (content|main)|cookie(s)?|accept( all)?|privacy( policy)?|all rights reserved|share|tweet|follow us|log in|sign in|subscribe|newsletter|back to top|read more)$/.test(
      s,
    )
  ) {
    return true;
  }
  if (/cookie (policy|banner|consent)/.test(s) && s.length < 80) return true;
  return false;
}

function isJunkBit(text: string) {
  const s = text.toLowerCase();
  if (isFluffBit(text)) return true;
  if (looksJunkLabel(s)) return true;
  if (/[★⭐]/.test(text)) return true;
  if (/\b\d(?:\.\d)?\s*(?:\/\s*5|stars?)\b/.test(s) && /review|rating|star/.test(s)) {
    return true;
  }
  if (/^\s*["“].{12,}["”]\s*[-–—]\s*\p{L}+/u.test(text)) return true;
  return false;
}

function isUsefulBit(text: string) {
  const s = text.toLowerCase();
  return /£|\$\d|price|hours?|\bam\b|\bpm\b|monday|tuesday|wednesday|thursday|friday|saturday|sunday|walk-?in|book|appointment|phone|tel\.?|email|contact|street|road|lane|about|staff|team|barber|fade|cut|beard|policy|cancel|location|address|https?:\/\/|\/[a-z0-9-]+\/[a-z0-9-]+|pace|cadence|article|km\b|5k|run/.test(
    s,
  );
}

function hasShopSchema(html: string) {
  return /"@type"\s*:\s*"(?:[^"]*(?:LocalBusiness|BarberShop|HairSalon|Store|Restaurant|Organization)[^"]*)"/i.test(
    html,
  );
}

function visibleTextLength(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

export function isUnusableHtml(html: string) {
  const t = html.toLowerCase();
  if (html.length < 400) return true;
  if (t.includes("robot challenge") || t.includes("sgcaptcha") || t.includes("sg-captcha")) {
    return true;
  }
  if (t.includes("just a moment") && t.includes("cloudflare")) return true;
  if (t.includes("attention required") && t.includes("cloudflare")) return true;
  if (t.includes("checking your browser") || t.includes("checking the site connection")) {
    return true;
  }
  if (/meta[^>]+http-equiv=["']refresh["'][^>]+(captcha|challenge)/i.test(html)) {
    return true;
  }
  if (t.includes("enable javascript") && html.length < 2500) return true;
  if (
    html.length < 8000 &&
    (t.includes("403 - forbidden") || t.includes("access to this page is forbidden"))
  ) {
    return true;
  }
  if (t.includes("suspected abuse") && html.length < 2000) return true;
  if (!hasShopSchema(html) && visibleTextLength(html) < 80 && /<script/i.test(html)) {
    return true;
  }
  return false;
}

function stripJunk($: ReturnType<typeof load>) {
  $("script, style, noscript, iframe, svg, canvas").remove();
  $("#wm-ipp-base, #wm-ipp, #donato").remove();
  $("[class], [id]").each((_, el) => {
    const node = $(el);
    const label = `${node.attr("class") || ""} ${node.attr("id") || ""}`;
    if (looksJunkLabel(label)) node.remove();
  });
  $("h1, h2, h3, h4").each((_, el) => {
    const node = $(el);
    if (!looksJunkLabel(node.text())) return;
    node.nextUntil("h1, h2, h3, h4").remove();
    node.remove();
  });
}

function walkLd(node: unknown, bits: string[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walkLd(item, bits);
    return;
  }
  const o = node as Record<string, unknown>;
  for (const key of ["name", "description", "telephone", "email", "priceRange"] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) bits.push(cleanText(v));
  }
  const hours = o.openingHours ?? o.openingHoursSpecification;
  if (typeof hours === "string") bits.push(cleanText(hours));
  if (Array.isArray(hours)) {
    for (const row of hours) {
      if (typeof row === "string") bits.push(cleanText(row));
      else walkLd(row, bits);
    }
  }
  if (hours && typeof hours === "object" && !Array.isArray(hours)) walkLd(hours, bits);
  if (o.dayOfWeek || o.opens || o.closes) {
    const line = [o.dayOfWeek, o.opens, o.closes]
      .flat()
      .filter((v) => typeof v === "string")
      .join(" ");
    if (line) bits.push(cleanText(line));
  }
  const addr = o.address;
  if (typeof addr === "string") bits.push(cleanText(addr));
  if (addr && typeof addr === "object") {
    const a = addr as Record<string, unknown>;
    const line = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode]
      .filter((v) => typeof v === "string")
      .join(", ");
    if (line) bits.push(cleanText(line));
  }
  walkLd(o["@graph"], bits);
}

function schemaBits(html: string, $: ReturnType<typeof load>) {
  const bits: string[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).text();
    try {
      walkLd(JSON.parse(raw), bits);
    } catch {
      /* skip broken json-ld */
    }
  });
  const desc =
    $("meta[name='description']").attr("content") ||
    $("meta[property='og:description']").attr("content") ||
    "";
  if (desc) bits.push(cleanText(desc));
  $("[itemprop='telephone'], [itemprop='address'], [itemprop='openingHours']").each((_, el) => {
    const t = cleanText($(el).text() || $(el).attr("content") || "");
    if (t) bits.push(t);
  });
  return bits;
}

function unwrapArchiveUrl(href: string) {
  const m = href.match(
    /https?:\/\/web\.archive\.org\/web\/\d+(?:id_)?\/(https?:\/\/.+)$/i,
  );
  return m?.[1] || href;
}

function canonicalizePageUrl(href: string) {
  try {
    const u = new URL(unwrapArchiveUrl(href));
    u.hash = "";
    u.search = "";
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.replace(/\/{2,}/g, "/");
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
    return u.href;
  } catch {
    return href;
  }
}

function pathDepth(pathname: string) {
  return pathname.replace(/\/+$/, "").split("/").filter(Boolean).length;
}

const PRIORITY_PATH =
  /^(about|about-us|aboutus|our-story|who-we-are|services?|treatments?|cuts?|prices?|pricing|price-list|menu|hours|opening-times|opening-hours|contact|contact-us|find-us|location|visit|faq|help|book|booking|bookings|reservations?)$/i;

export function isPriorityPath(pathname: string, navTop: Set<string>) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return true;
  const segs = path.split("/").filter(Boolean);
  const first = (segs[0] || "").toLowerCase();
  if (navTop.has(path) || navTop.has(`/${first}`)) return true;
  return PRIORITY_PATH.test(first);
}

function extract(html: string, pageUrl: string) {
  const $ = load(html);
  const extra = schemaBits(html, $);
  stripJunk($);
  const title =
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text()) ||
    pageUrl;
  const bits: string[] = [...extra];
  $("h1, h2, h3, h4, p, li, dt, dd, td, th").each((_, el) => {
    const t = cleanText($(el).text());
    if (!t) return;
    if (isJunkBit(t)) return;
    if (t.length < 12 && !isUsefulBit(t)) return;
    bits.push(t);
  });
  const links: string[] = [];
  const seenHref = new Set<string>();
  let pageOrigin: URL | null = null;
  try {
    pageOrigin = new URL(pageUrl);
  } catch {
    pageOrigin = null;
  }
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    try {
      const abs = canonicalizePageUrl(new URL(href, pageUrl).href);
      if (seenHref.has(abs)) return;
      seenHref.add(abs);
      const absUrl = new URL(abs);
      const onSite = pageOrigin ? sameSite(pageOrigin, absUrl) : false;
      if (onSite) links.push(abs);
      const label = cleanText($(el).text());
      if (
        onSite &&
        label &&
        label.length >= 8 &&
        !isFluffBit(label) &&
        !/^(home|running|tools|apps|privacy)$/i.test(label)
      ) {
        bits.push(`${label} ${abs}`);
      }
    } catch {
      /* skip */
    }
  });
  const body = bits.slice(0, MAX_BLOCKS).join("\n");
  return { title, body, links };
}

function extractIndex(html: string, pageUrl: string) {
  const $ = load(html);
  const title =
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text()) ||
    pageUrl;
  const desc =
    cleanText($("meta[name='description']").attr("content") || "") ||
    cleanText($("meta[property='og:description']").attr("content") || "") ||
    cleanText($("p").first().text());
  return { title, body: desc.slice(0, INDEX_SUMMARY) };
}

function collectNavTop(html: string, pageUrl: string, start: URL) {
  const $ = load(html);
  const top = new Set<string>(["/"]);
  $("header a[href], nav a[href], [role='navigation'] a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    try {
      const abs = new URL(canonicalizePageUrl(new URL(href, pageUrl).href));
      if (!sameSite(start, abs)) return;
      if (isJunkPath(abs.pathname) || SKIP_FILE.test(abs.pathname)) return;
      if (pathDepth(abs.pathname) <= 1) {
        top.add(abs.pathname.replace(/\/+$/, "") || "/");
      }
    } catch {
      /* skip */
    }
  });
  return top;
}

function parseSitemapLocs(xml: string) {
  const locs: string[] = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const href = cleanText(match[1]).replace(/&amp;/g, "&");
    if (href) locs.push(href);
  }
  return locs;
}

export type ScanPage = {
  url: string;
  title: string;
  body: string;
  mode: "full" | "index";
};

export type ScanResult = {
  pages: ScanPage[];
  found: number;
  full: number;
  indexed: number;
  skipped?: number;
  error?: string;
};

function looksHtml(type: string, head: string) {
  if (type.includes("text/html") || type.includes("application/xhtml")) return true;
  if (!type || type === "text/plain" || type.includes("json")) {
    const start = head.slice(0, 200).toLowerCase();
    return (
      start.includes("<!doctype") ||
      start.includes("<html") ||
      start.includes("<head") ||
      start.includes("archived_snapshots")
    );
  }
  return false;
}

const FETCH_HEADERS = {
  "user-agent": BROWSER_UA,
  accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
  "accept-language": "en-GB,en;q=0.8",
};

async function curlGet(
  url: string,
): Promise<{ status: number; url: string; body: string } | null> {
  return new Promise((resolve) => {
    const child = spawn("curl", [
      "-sS",
      "-L",
      "--max-redirs",
      "5",
      "--max-time",
      String(Math.ceil(FETCH_MS / 1000)),
      "-A",
      BROWSER_UA,
      "-H",
      "Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      "-H",
      "Accept-Language: en-GB,en;q=0.8",
      "-w",
      "\n__CURL__ %{http_code} %{url_effective}",
      url,
    ]);
    let buf = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, FETCH_MS + 800);
    child.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      if (buf.length > MAX_DOWNLOAD + 200) child.kill("SIGKILL");
    });
    child.stderr.on("data", () => {
      /* ignore progress noise */
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on("close", () => {
      clearTimeout(timer);
      const mark = buf.lastIndexOf("\n__CURL__ ");
      const body = (mark >= 0 ? buf.slice(0, mark) : buf).slice(0, MAX_BYTES);
      const meta = mark >= 0 ? buf.slice(mark + 10).trim() : "";
      const status = Number(meta.split(/\s+/)[0] || 0);
      const finalUrl = meta.split(/\s+/).slice(1).join(" ") || url;
      if (!status) {
        resolve(null);
        return;
      }
      resolve({ status, url: finalUrl, body });
    });
  });
}

async function nodeGet(
  url: string,
): Promise<{ status: number; url: string; body: string } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(FETCH_MS),
    });
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (
      type.includes("image/") ||
      type.includes("video/") ||
      type.includes("audio/") ||
      type.includes("application/pdf") ||
      type.includes("octet-stream")
    ) {
      return { status: res.status, url: res.url || url, body: "" };
    }
    const length = Number(res.headers.get("content-length") || 0);
    if (length > MAX_DOWNLOAD) return null;
    const raw = await res.text();
    return { status: res.status, url: res.url || url, body: raw.slice(0, MAX_BYTES) };
  } catch {
    return null;
  }
}

async function fetchHtml(
  url: string,
): Promise<{ url: string; html: string; missing?: boolean } | null> {
  const res = await nodeGet(url);
  if (!res) return null;
  if (res.status === 404 || res.status === 410) return { url, html: "", missing: true };
  if (res.status >= 400 && res.status !== 403 && res.status !== 503) return null;
  if (!res.body) return null;
  const type = "";
  if (!looksHtml(type, res.body) && res.status !== 202) {
    if (!res.body.toLowerCase().includes("<html") && res.status !== 202) return null;
  }
  return { url: res.url || url, html: res.body };
}

async function fetchArchived(url: string): Promise<{ url: string; html: string } | null> {
  let snapUrl = `https://web.archive.org/web/2/${url}`;
  try {
    const avail = await nodeGet(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    );
    if (avail?.body) {
      const data = JSON.parse(avail.body) as {
        archived_snapshots?: { closest?: { url?: string; available?: boolean } };
      };
      const snap = data.archived_snapshots?.closest;
      if (snap?.available && snap.url) {
        snapUrl = snap.url.replace(/^http:/, "https:");
      }
    }
  } catch {
    /* latest calendar path still tried below */
  }

  const page = await curlGet(snapUrl);
  if (!page || page.status >= 400 || !page.body) return null;
  if (isUnusableHtml(page.body)) return null;
  return { url, html: page.body };
}

async function loadPage(
  url: string,
  liveBlocked: boolean,
): Promise<{ url: string; html: string } | "missing" | "blocked" | null> {
  if (!liveBlocked) {
    const live = await fetchHtml(url);
    if (live?.missing) return "missing";
    if (live && live.html && !isUnusableHtml(live.html)) return live;
    return "blocked";
  }
  const archived = await fetchArchived(url);
  return archived ?? "blocked";
}

function urlKey(value: string) {
  return canonicalizePageUrl(value);
}

function remainingMs(started: number) {
  return SCAN_MS - (Date.now() - started);
}

export async function scanSite(startUrl: string): Promise<ScanResult> {
  if (!isHttpUrl(startUrl)) {
    return {
      pages: [],
      found: 0,
      full: 0,
      indexed: 0,
      error: "That does not look like a web address.",
    };
  }

  const started = Date.now();
  const start = new URL(canonicalizePageUrl(startUrl));
  const discovered = new Set<string>([start.href]);
  const htmlCache = new Map<string, string>();
  const fetched = new Set<string>();
  let skipped = 0;
  let liveBlocked = false;
  let archiveTries = 0;
  let navTop = new Set<string>(["/"]);

  function allow(href: string): string | null {
    try {
      const next = new URL(canonicalizePageUrl(href));
      if (!sameSite(start, next)) return null;
      if (isJunkPath(next.pathname) || SKIP_FILE.test(next.pathname)) return null;
      if (/cdn-cgi/i.test(next.pathname)) return null;
      if (discovered.size >= MAX_DISCOVER && !discovered.has(next.href)) return null;
      return next.href;
    } catch {
      return null;
    }
  }

  function remember(href: string) {
    const next = allow(href);
    if (next) discovered.add(next);
  }

  async function grab(url: string): Promise<string | null> {
    const key = urlKey(url);
    if (htmlCache.has(key)) return htmlCache.get(key) || null;
    if (fetched.has(key)) return null;
    fetched.add(key);
    const got = await loadPage(url, liveBlocked);
    if (got === "missing") {
      skipped += 1;
      return null;
    }
    if (got === "blocked" || !got) {
      skipped += 1;
      return null;
    }
    let pageUrl = canonicalizePageUrl(got.url || url);
    try {
      if (!sameSite(start, new URL(pageUrl))) pageUrl = canonicalizePageUrl(url);
    } catch {
      pageUrl = canonicalizePageUrl(url);
    }
    htmlCache.set(urlKey(pageUrl), got.html);
    htmlCache.set(key, got.html);
    return got.html;
  }

  async function readSitemaps() {
    const roots = [
      new URL("/sitemap.xml", start.origin).href,
      new URL("/sitemap_index.xml", start.origin).href,
    ];
    const robots = await nodeGet(new URL("/robots.txt", start.origin).href);
    if (robots?.body) {
      for (const line of robots.body.split(/\r?\n/)) {
        const m = line.match(/^\s*sitemap:\s*(\S+)/i);
        if (m?.[1]) roots.push(m[1].trim());
      }
    }
    const queue = [...new Set(roots)];
    const seenMaps = new Set<string>();
    while (queue.length && seenMaps.size < MAX_SITEMAPS && remainingMs(started) > 4_000) {
      const mapUrl = queue.shift() as string;
      if (seenMaps.has(mapUrl)) continue;
      seenMaps.add(mapUrl);
      const doc = await nodeGet(mapUrl);
      if (!doc?.body || doc.status >= 400) continue;
      const locs = parseSitemapLocs(doc.body);
      if (/<sitemapindex/i.test(doc.body)) {
        for (const loc of locs) {
          if (queue.length + seenMaps.size >= MAX_SITEMAPS) break;
          queue.push(loc);
        }
        continue;
      }
      for (const loc of locs) remember(loc);
    }
  }

  const home = await grab(start.href);
  if (home && isUnusableHtml(home) && !liveBlocked) {
    liveBlocked = true;
    fetched.delete(urlKey(start.href));
    htmlCache.delete(urlKey(start.href));
    const archived = await grab(start.href);
    if (archived) {
      navTop = collectNavTop(archived, start.href, start);
      rememberLinksFrom(archived, start.href);
    }
  } else if (home) {
    navTop = collectNavTop(home, start.href, start);
    rememberLinksFrom(home, start.href);
  }

  function rememberLinksFrom(html: string, pageUrl: string) {
    try {
      const { links } = extract(html, pageUrl);
      for (const href of links) remember(href);
    } catch {
      /* skip */
    }
  }

  await readSitemaps();

  const bfsQueue = [...discovered];
  let discoverFetches = 1;
  while (
    bfsQueue.length &&
    discoverFetches < DISCOVER_FETCH &&
    remainingMs(started) > 8_000
  ) {
    const url = bfsQueue.shift() as string;
    if (urlKey(url) === urlKey(start.href) && htmlCache.has(urlKey(url))) continue;
    const html = await grab(url);
    discoverFetches += 1;
    if (!html) continue;
    const before = discovered.size;
    rememberLinksFrom(html, url);
    if (discovered.size > before) {
      for (const href of discovered) {
        if (!fetched.has(urlKey(href))) bfsQueue.push(href);
      }
    }
  }

  function canonicalIsHome(html: string, url: string) {
    if (urlKey(url) === urlKey(start.href)) return true;
    const $ = load(html);
    const canon = $("link[rel='canonical']").attr("href");
    if (!canon) return false;
    try {
      return urlKey(new URL(canon, url).href) === urlKey(start.href);
    } catch {
      return false;
    }
  }

  for (const path of PATH_GUESSES) {
    if (remainingMs(started) < 8_000) break;
    const href = canonicalizePageUrl(new URL(path, start.origin).href);
    if (discovered.has(href)) continue;
    const html = await grab(href);
    if (!html || canonicalIsHome(html, href)) continue;
    remember(href);
  }

  const foundList = [...discovered];
  const found = foundList.length;
  const fullAll = found <= FULL_IF_AT_MOST;

  function wantsFull(url: string) {
    if (fullAll) return true;
    try {
      return isPriorityPath(new URL(url).pathname, navTop);
    } catch {
      return false;
    }
  }

  const ordered = [...foundList].sort((a, b) => {
    const af = wantsFull(a) ? 0 : 1;
    const bf = wantsFull(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return pageRank(a, start.pathname) - pageRank(b, start.pathname);
  });

  const pages: ScanPage[] = [];
  const seenPage = new Set<string>();

  async function take(urls: string[]) {
    const size = liveBlocked ? ARCHIVE_BATCH : BATCH;
    for (let i = 0; i < urls.length; i += size) {
      if (remainingMs(started) < 1_200) break;
      if (liveBlocked && archiveTries >= MAX_ARCHIVE) break;
      const batch = urls.slice(i, i + size);
      const rows = await Promise.all(
        batch.map(async (url) => ({ url, html: await grab(url) })),
      );
      if (liveBlocked) archiveTries += batch.length;
      for (const { url, html } of rows) {
        const key = urlKey(url);
        if (seenPage.has(key)) continue;
        if (!html) continue;
        try {
          const pageUrl = key;
          const full = wantsFull(pageUrl);
          const parsed = full ? extract(html, pageUrl) : extractIndex(html, pageUrl);
          if (
            /^(403|404|429)\b/.test(parsed.title) ||
            /forbidden|access denied|page not found|couldn't find that page/i.test(
              parsed.title,
            )
          ) {
            skipped += 1;
            continue;
          }
          const body = full ? parsed.body.slice(0, MAX_BODY) : parsed.body;
          if (full && body.length < 12) {
            skipped += 1;
            continue;
          }
          seenPage.add(key);
          pages.push({
            url: pageUrl,
            title: parsed.title,
            body,
            mode: full ? "full" : "index",
          });
          if (full) rememberLinksFrom(html, pageUrl);
        } catch {
          skipped += 1;
        }
      }
    }
  }

  await take(ordered.filter(wantsFull));
  if (remainingMs(started) > 1_500) {
    await take(ordered.filter((u) => !wantsFull(u)));
  }

  const full = pages.filter((p) => p.mode === "full").length;
  const indexed = pages.filter((p) => p.mode === "index").length;

  if (!pages.length) {
    return {
      pages: [],
      found,
      full: 0,
      indexed: 0,
      skipped,
      error: "No readable pages found. Check the address is public HTML.",
    };
  }

  pages.sort((a, b) => {
    if (a.mode !== b.mode) return a.mode === "full" ? -1 : 1;
    return pageRank(a.url, start.pathname) - pageRank(b.url, start.pathname);
  });

  return { pages, found, full, indexed, skipped };
}
