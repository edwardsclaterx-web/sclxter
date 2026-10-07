import { load } from "cheerio";

const MAX_PAGES = 8;
const MAX_BYTES = 80_000;
const DELAY_MS = 350;

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

function extract(html: string, pageUrl: string) {
  const $ = load(html);
  $("script, style, noscript, iframe, svg").remove();
  const title =
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text()) ||
    pageUrl;
  const bits: string[] = [];
  $("h1, h2, h3, p, li, dt, dd").each((_, el) => {
    const t = cleanText($(el).text());
    if (t.length > 20) bits.push(t);
  });
  const body = bits.slice(0, 40).join("\n");
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

  while (queue.length && pages.length < MAX_PAGES) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);

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
      pages.push({ url, title, body: body.slice(0, 4000) });
    }

    const prefix = start.pathname.endsWith("/")
      ? start.pathname
      : `${start.pathname}/`;
    const rootScan = start.pathname === "/" || start.pathname === "";

    for (const href of links) {
      try {
        const next = new URL(href);
        if (!sameOrigin(start, next)) continue;
        if (!rootScan) {
          const path = next.pathname.endsWith("/")
            ? next.pathname
            : `${next.pathname}/`;
          const isStart = next.pathname === start.pathname;
          const under = path.startsWith(prefix);
          if (!isStart && !under) continue;
        }
        if (seen.has(next.href) || queue.includes(next.href)) continue;
        if (queue.length + pages.length >= MAX_PAGES * 2) break;
        queue.push(next.href);
      } catch {
        /* skip */
      }
    }

    if (queue.length && pages.length < MAX_PAGES) await sleep(DELAY_MS);
  }

  if (!pages.length) {
    return {
      pages: [],
      error: "No readable pages found. Check the address is public HTML.",
    };
  }

  return { pages };
}
