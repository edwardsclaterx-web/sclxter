import { load } from "cheerio";

const MAX_PAGES = 8;
const MAX_BYTES = 80_000;
const DELAY_MS = 350;
const MAX_BLOCKS = 40;
const MAX_BODY = 4000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

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

function sameOrigin(a: URL, b: URL) {
  return a.origin === b.origin;
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

const JUNK_PATH =
  /(^|\/)(reviews?|testimonials?|ratings?|comments?|feedback|trustpilot)(\/|$)/i;

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
  if (isJunkPath(path)) return 1000;
  const start = (startPath.replace(/\/+$/, "") || "/") ;
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
  $("script, style, noscript, iframe, svg").remove();
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
  $("h1, h2, h3, p, li, dt, dd").each((_, el) => {
    const t = cleanText($(el).text());
    if (t.length <= 20) return;
    if (isJunkBit(t)) return;
    bits.push(t);
  });
  bits.sort((a, b) => Number(isUsefulBit(b)) - Number(isUsefulBit(a)));
  const body = bits.slice(0, MAX_BLOCKS).join("\n");
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
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

export async function scanSite(
  startUrl: string,
): Promise<{ pages: ScanPage[]; error?: string }> {
  if (!isHttpUrl(startUrl)) {
    return { pages: [], error: "That does not look like a web address." };
  }

  const start = new URL(startUrl);
  const seen = new Set<string>();
  const queue = [start.href];
  const pages: ScanPage[] = [];

  function enqueue(href: string) {
    try {
      const next = new URL(href);
      if (!sameOrigin(start, next)) return;
      const prefix = start.pathname.endsWith("/")
        ? start.pathname
        : `${start.pathname}/`;
      const rootScan = start.pathname === "/" || start.pathname === "";
      if (!rootScan) {
        const path = next.pathname.endsWith("/")
          ? next.pathname
          : `${next.pathname}/`;
        const isStart = next.pathname === start.pathname;
        const under = path.startsWith(prefix);
        if (!isStart && !under) return;
      }
      if (isJunkPath(next.pathname)) return;
      if (seen.has(next.href) || queue.includes(next.href)) return;
      if (queue.length + pages.length >= MAX_PAGES * 2) return;
      queue.push(next.href);
      queue.sort(
        (a, b) => pageRank(a, start.pathname) - pageRank(b, start.pathname),
      );
    } catch {
      /* skip */
    }
  }

  while (queue.length && pages.length < MAX_PAGES) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    if (isJunkPath(new URL(url).pathname)) continue;

    let html = "";
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "SCLXTER-scan/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.includes("text/html")) continue;
      html = (await res.text()).slice(0, MAX_BYTES);
    } catch {
      continue;
    }

    const { title, body, links } = extract(html, url);
    if (body.length > 40) {
      pages.push({ url, title, body: body.slice(0, MAX_BODY) });
    }

    for (const href of links) enqueue(href);

    if (queue.length && pages.length < MAX_PAGES) await sleep(DELAY_MS);
  }

  if (!pages.length) {
    return {
      pages: [],
      error: "No readable pages found. Check the address is public HTML.",
    };
  }

  pages.sort(
    (a, b) => pageRank(a.url, start.pathname) - pageRank(b.url, start.pathname),
  );
  return { pages };
}
