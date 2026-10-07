import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { id } from "@/lib/ids";
import { resolveWebsiteUrl, scanSite } from "@/lib/scan";
import { updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const biz = await getOrCreateBusiness(user);
  const origin = new URL(request.url).origin;
  const start = resolveWebsiteUrl(biz.websiteUrl, origin);
  if (!start) {
    return NextResponse.json(
      { error: "Save a website URL first." },
      { status: 400 },
    );
  }

  const { pages, error } = await scanSite(start);
  if (error) return NextResponse.json({ error }, { status: 422 });

  const now = new Date().toISOString();
  const items = await updateStore((data) => {
    data.knowledge = data.knowledge.filter(
      (k) => !(k.businessId === biz.id && k.source === "scan"),
    );
    const created = pages.map((page) => ({
      id: id("know"),
      businessId: biz.id,
      source: "scan" as const,
      title: page.title,
      body: page.body,
      url: page.url,
      createdAt: now,
      updatedAt: now,
    }));
    data.knowledge.push(...created);
    return created;
  });

  return NextResponse.json({ items, pages: items.length });
}
