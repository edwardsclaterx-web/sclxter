import { NextResponse } from "next/server";

export const maxDuration = 30;
import { getSessionUser } from "@/lib/auth";
import { isAdmin, resolveBusiness, toClientBusiness } from "@/lib/access";
import { applyScanToNotepad } from "@/lib/notepad-scan";
import { resolveWebsiteUrl, scanSite } from "@/lib/scan";
import { readStore, updateStore } from "@/lib/store";

function compilePages(
  pages: { url: string; title: string; body: string; mode?: "full" | "index" }[],
  scannedAt: string,
  stats: { found: number; full: number },
) {
  const full = pages.filter((p) => p.mode !== "index");
  const indexed = pages.filter((p) => p.mode === "index");
  const parts = full.map(
    (p) => `### ${p.title}\nSource: ${p.url}\n${p.body}`.trim(),
  );
  if (indexed.length) {
    parts.push("### Other pages on this site");
    for (const p of indexed) {
      const summary = p.body ? `\n${p.body}` : "";
      parts.push(`${p.title}\nSource: ${p.url}${summary}`.trim());
    }
  }
  return `## Scan ${scannedAt}\n${stats.found} pages found, ${stats.full} read in full.\n\n${parts.join("\n\n")}`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    seq?: number;
    confirm?: boolean;
    ack?: boolean;
  };
  if (!body.confirm) {
    return NextResponse.json(
      { error: "Confirm the scan first." },
      { status: 400 },
    );
  }
  if (!body.ack) {
    return NextResponse.json(
      { error: "Acknowledge the scan first." },
      { status: 400 },
    );
  }
  const seq = typeof body.seq === "number" ? body.seq : null;
  const biz = await resolveBusiness(user, seq);
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const origin = new URL(request.url).origin;
  const start = resolveWebsiteUrl(biz.websiteUrl, origin);
  if (!start) {
    return NextResponse.json(
      { error: "Save a website URL first." },
      { status: 400 },
    );
  }

  const { pages, error, skipped, found, full, indexed } = await scanSite(start);
  if (error) {
    return NextResponse.json(
      {
        error:
          "error with scan send your website to administrator for information to be extracted",
      },
      { status: 422 },
    );
  }

  const block = compilePages(pages, new Date().toISOString(), {
    found,
    full,
  });
  const updated = await updateStore((data) => {
    const row = data.businesses.find((b) => b.id === biz.id);
    if (!row) return biz;
    row.notepad = applyScanToNotepad(row.notepad || "", row.lastScanText, block);
    row.lastScanText = block;
    row.scannedAt = new Date().toISOString();
    return row;
  });

  const data = await readStore();
  const owner = data.users.find((u) => u.id === updated.ownerId);
  const admin = isAdmin(user);
  return NextResponse.json({
    pages: pages.length,
    found,
    full,
    indexed,
    skipped: skipped ?? 0,
    business: toClientBusiness(updated, {
      admin,
      ownerEmail: admin ? owner?.email : undefined,
    }),
  });
}
