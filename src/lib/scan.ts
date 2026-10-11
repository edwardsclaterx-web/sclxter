import { spawn } from "node:child_process";
import { load } from "cheerio";

const MAX_PAGES = 16;
const MAX_BYTES = 250_000;
const MAX_DOWNLOAD = 1_500_000;
const MAX_BLOCKS = 80;
const MAX_BODY = 8_000;
const FETCH_MS = 4_000;
const SCAN_MS = 16_000;
const BATCH = 4;
const ARCHIVE_BATCH = 2;
const MAX_ARCHIVE = 8;

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

const SKIP_FILE = /\.(pdf|jpe?g|png|gif|webp|svg|mp4|mp3|zip|docx?|xlsx?)$/i;

const INFRA_PATH = /^\/(\.well-known|cdn-cgi)(\/|$)/i;

const USEFUL_PATH: Array<{ re: RegExp; rank: number }> = [
  { re: /about|our-story|who-we-are/, rank: 1 },
  { re: /service|cuts?|menu|treatments?/, rank: 2 },
  { re: /pric|cost|fees?/, rank: 3 },
  { re: /contact|find-us|location|visit/, rank: 4 },
  { re: /book|walk-?in|hours|opening/, rank: 5 },
  { re: /staff|team|barbers?/, rank: 6 },
  { re: /polic|terms/, rank: 7 },
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

function isJunkBit(text: string) {
  const s = text.toLowerCase();
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
  return /£|\$\d|price|hours?|\bam\b|\bpm\b|monday|tuesday|wednesday|thursday|friday|saturday|sunday|walk-?in|book|appointment|phone|tel\.?|email|contact|street|road|lane|about|staff|team|barber|fade|cut|beard|policy|cancel|location|address/.test(
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
    const useful = isUsefulBit(t);
    if (!useful && t.length < 12) return;
    if (useful && t.length < 3) return;
    bits.push(t);
  });
  bits.sort((a, b) => Number(isUsefulBit(b)) - Number(isUsefulBit(a)));
  const body = bits.slice(0, MAX_BLOCKS).join("\n");
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    try {
      const abs = unwrapArchiveUrl(new URL(href, pageUrl).href.split("#")[0]);
      links.push(abs);
    } catch {
      /* skip */
    }
  });
  return { title, body, links };
}

export type ScanPage = {
  url: string;
  title: string;
  body: string;
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
  return value.replace(/\/$/, "") || value;
}

export async function scanSite(
  startUrl: string,
): Promise<{ pages: ScanPage[]; error?: string; skipped?: number }> {
  if (!isHttpUrl(startUrl)) {
    return { pages: [], error: "That does not look like a web address." };
  }

  const started = Date.now();
  const start = new URL(startUrl);
  const seen = new Set<string>();
  const wanted = new Set<string>([start.href]);
  for (const path of PATH_GUESSES) {
    wanted.add(new URL(path, start.origin).href);
  }
  const pages: ScanPage[] = [];
  let skipped = 0;
  let liveBlocked = false;
  let archiveTries = 0;

  function allow(href: string): string | null {
    try {
      const next = new URL(unwrapArchiveUrl(href));
      if (!sameSite(start, next)) return null;
      if (isJunkPath(next.pathname) || SKIP_FILE.test(next.pathname)) return null;
      const key = urlKey(next.href);
      if (seen.has(key) || seen.has(next.href)) return null;
      return next.href;
    } catch {
      return null;
    }
  }

  function rememberLinks(links: string[]) {
    for (const href of links) {
      const next = allow(href);
      if (!next) continue;
      wanted.add(next);
    }
  }

  function takeBatch() {
    const open = [...wanted].filter((u) => {
      const key = urlKey(u);
      return !seen.has(key) && !seen.has(u);
    });
    open.sort((a, b) => pageRank(a, start.pathname) - pageRank(b, start.pathname));
    return open.slice(0, liveBlocked ? ARCHIVE_BATCH : BATCH);
  }

  while (pages.length < MAX_PAGES) {
    if (Date.now() - started > SCAN_MS) break;
    const batch = takeBatch();
    if (!batch.length) break;
    for (const url of batch) {
      seen.add(url);
      seen.add(urlKey(url));
    }
    const fetched = await Promise.all(
      batch.map(async (url) => ({ url, got: await loadPage(url, liveBlocked) })),
    );
    const retry: string[] = [];
    for (const { url, got } of fetched) {
      if (got === "missing") {
        skipped += 1;
        continue;
      }
      if (got === "blocked" || !got) {
        skipped += 1;
        if (!liveBlocked) retry.push(url);
        continue;
      }
      try {
        const { title, body, links } = extract(got.html, got.url);
        rememberLinks(links);
        if (
          body.length >= 12 &&
          !/^(403|404|429)\b/.test(title) &&
          !/forbidden|access denied|page not found|couldn't find that page/i.test(title)
        ) {
          pages.push({ url: got.url, title, body: body.slice(0, MAX_BODY) });
        } else {
          skipped += 1;
        }
      } catch {
        skipped += 1;
      }
    }
    if (retry.length && pages.length === 0) {
      liveBlocked = true;
      for (const url of retry) {
        seen.delete(url);
        seen.delete(urlKey(url));
        wanted.add(url);
      }
    }
    if (liveBlocked && !retry.length) {
      archiveTries += batch.length;
      if (archiveTries >= MAX_ARCHIVE) break;
    }
  }

  if (!pages.length) {
    return {
      pages: [],
      skipped,
      error: "No readable pages found. Check the address is public HTML.",
    };
  }

  pages.sort(
    (a, b) => pageRank(a.url, start.pathname) - pageRank(b.url, start.pathname),
  );
  return { pages: pages.slice(0, MAX_PAGES), skipped };
}
