import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { id } from "@/lib/ids";
import { updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const biz = await getOrCreateBusiness(user);
  const body = (await request.json()) as { title?: string; body?: string };
  const title = body.title?.trim() ?? "";
  const text = body.body?.trim() ?? "";
  if (!title || !text) {
    return NextResponse.json(
      { error: "Add a title and the fact itself." },
      { status: 400 },
    );
  }
  const now = new Date().toISOString();
  const item = await updateStore((data) => {
    const row = {
      id: id("know"),
      businessId: biz.id,
      source: "note" as const,
      title,
      body: text,
      createdAt: now,
      updatedAt: now,
    };
    data.knowledge.push(row);
    return row;
  });
  return NextResponse.json({ item });
}
