import { load } from "cheerio";

const MAX_PAGES = 16;
const MAX_BYTES = 250_000;
const MAX_DOWNLOAD = 1_500_000;
const MAX_BLOCKS = 80;
const MAX_BODY = 8_000;
const FETCH_MS = 4_000;
const SCAN_MS = 12_000;
const BATCH = 4;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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
  return JUNK_PATH.test(pathname.replace(/\/+$/, "") || "/");
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

function stripJunk($: ReturnType<typeof load>) {
  $("script, style, noscript, iframe, svg, canvas").remove();
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

function extract(html: string, pageUrl: string) {
  const $ = load(html);
  stripJunk($);
  const title =
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text()) ||
    pageUrl;
  const bits: string[] = [];
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
      links.push(new URL(href, pageUrl).href.split("#")[0]);
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
  if (!type || type === "text/plain") {
    const start = head.slice(0, 200).toLowerCase();
    return start.includes("<!doctype") || start.includes("<html") || start.includes("<head");
  }
  return false;
}

async function fetchHtml(
  url: string,
): Promise<{ url: string; html: string } | null> {
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
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (
      type.includes("image/") ||
      type.includes("video/") ||
      type.includes("audio/") ||
      type.includes("application/pdf") ||
      type.includes("octet-stream")
    ) {
      return null;
    }
    const length = Number(res.headers.get("content-length") || 0);
    if (length > MAX_DOWNLOAD) return null;
    const raw = await res.text();
    if (!looksHtml(type, raw)) return null;
    return { url: res.url || url, html: raw.slice(0, MAX_BYTES) };
  } catch {
    return null;
  }
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
  const pages: ScanPage[] = [];
  let skipped = 0;

  function allow(href: string): string | null {
    try {
      const next = new URL(href);
      if (!sameSite(start, next)) return null;
      if (isJunkPath(next.pathname) || SKIP_FILE.test(next.pathname)) return null;
      const key = next.href.replace(/\/$/, "") || next.origin;
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
      const key = u.replace(/\/$/, "") || u;
      return !seen.has(key) && !seen.has(u);
    });
    open.sort((a, b) => pageRank(a, start.pathname) - pageRank(b, start.pathname));
    return open.slice(0, BATCH);
  }

  while (pages.length < MAX_PAGES) {
    if (Date.now() - started > SCAN_MS) break;
    const batch = takeBatch();
    if (!batch.length) break;
    for (const url of batch) {
      seen.add(url);
      seen.add(url.replace(/\/$/, "") || url);
    }
    const fetched = await Promise.all(batch.map((url) => fetchHtml(url)));
    for (let i = 0; i < batch.length; i += 1) {
      const got = fetched[i];
      if (!got) {
        skipped += 1;
        continue;
      }
      try {
        const { title, body, links } = extract(got.html, got.url);
        rememberLinks(links);
        if (body.length >= 12) {
          pages.push({ url: got.url, title, body: body.slice(0, MAX_BODY) });
        }
      } catch {
        skipped += 1;
      }
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
