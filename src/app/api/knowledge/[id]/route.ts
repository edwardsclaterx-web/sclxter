import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { updateStore } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const biz = await getOrCreateBusiness(user);
  const { id } = await ctx.params;
  const body = (await request.json()) as { title?: string; body?: string };
  const item = await updateStore((data) => {
    const row = data.knowledge.find(
      (k) => k.id === id && k.businessId === biz.id,
    );
    if (!row) return null;
    if (typeof body.title === "string") row.title = body.title.trim();
    if (typeof body.body === "string") row.body = body.body.trim();
    row.updatedAt = new Date().toISOString();
    return row;
  });
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const biz = await getOrCreateBusiness(user);
  const { id } = await ctx.params;
  const ok = await updateStore((data) => {
    const before = data.knowledge.length;
    data.knowledge = data.knowledge.filter(
      (k) => !(k.id === id && k.businessId === biz.id),
    );
    return data.knowledge.length < before;
  });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
