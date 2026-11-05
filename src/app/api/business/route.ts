import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requireActiveUser } from "@/lib/require-active";
import { isAdmin, resolveBusiness, toClientBusiness } from "@/lib/access";
import { persistLastError } from "@/lib/persist";
import { readStore, updateStore } from "@/lib/store";
import { TONES } from "@/lib/tones";
import { parseThemeInput } from "@/lib/widget-theme";
import type { WidgetTheme } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = requireActiveUser(await getSessionUser());
  if (user instanceof NextResponse) return user;
  const url = new URL(request.url);
  const seqRaw = url.searchParams.get("seq");
  const seq = seqRaw ? Number(seqRaw) : null;
  const biz = await resolveBusiness(user, seq && Number.isFinite(seq) ? seq : null);
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const data = await readStore();
  const owner = data.users.find((u) => u.id === biz.ownerId);
  const admin = isAdmin(user);
  const res = NextResponse.json({
    business: toClientBusiness(biz, {
      admin,
      ownerEmail: admin ? owner?.email : undefined,
    }),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function PATCH(request: Request) {
  const user = requireActiveUser(await getSessionUser());
  if (user instanceof NextResponse) return user;
  const body = (await request.json()) as {
    seq?: number;
    name?: string;
    websiteUrl?: string;
    industry?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactOther?: string;
    tone?: string;
    notepad?: string;
    theme?: WidgetTheme;
  };
  const seq = typeof body.seq === "number" ? body.seq : null;
  const biz = await resolveBusiness(user, seq);
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const tones = new Set(TONES.map((t) => t.id));
  let nextTheme: WidgetTheme | undefined;
  if (body.theme) {
    const parsed = parseThemeInput(body.theme);
    if (parsed === "same") {
      return NextResponse.json(
        { error: "Text and primary must be different colours." },
        { status: 400 },
      );
    }
    if (!parsed) {
      return NextResponse.json({ error: "Pick colours from the list." }, { status: 400 });
    }
    nextTheme = parsed;
  }
  let updated;
  try {
    updated = await updateStore((data) => {
    const row = data.businesses.find((b) => b.id === biz.id);
    if (!row) return biz;
    if (typeof body.name === "string") row.name = body.name.trim();
    if (typeof body.websiteUrl === "string") row.websiteUrl = body.websiteUrl.trim();
    if (typeof body.industry === "string") row.industry = body.industry.trim();
    if (typeof body.contactPhone === "string") row.contactPhone = body.contactPhone.trim();
    if (typeof body.contactEmail === "string") row.contactEmail = body.contactEmail.trim();
    if (typeof body.contactOther === "string") row.contactOther = body.contactOther.trim();
    if (typeof body.tone === "string" && tones.has(body.tone as never)) {
      row.tone = body.tone;
    }
    if (typeof body.notepad === "string") row.notepad = body.notepad;
    if (nextTheme) {
      row.appearance = {
        ...row.appearance,
        colour: nextTheme.primary,
        theme: nextTheme,
      };
    }
    return row;
  });
  } catch (err) {
    const detail =
      persistLastError() ||
      (err instanceof Error ? err.message : "Could not persist shop data.");
    return NextResponse.json({ error: "Could not save.", detail }, { status: 503 });
  }

  const data = await readStore();
  const owner = data.users.find((u) => u.id === updated.ownerId);
  const admin = isAdmin(user);
  const res = NextResponse.json({
    business: toClientBusiness(updated, {
      admin,
      ownerEmail: admin ? owner?.email : undefined,
    }),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
