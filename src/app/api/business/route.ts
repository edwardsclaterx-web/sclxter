import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { updateStore } from "@/lib/store";
import type { Appearance } from "@/lib/types";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const biz = await getOrCreateBusiness(user);
  const body = (await request.json()) as {
    name?: string;
    websiteUrl?: string;
    appearance?: Partial<Appearance>;
  };

  const updated = await updateStore((data) => {
    const row = data.businesses.find((b) => b.id === biz.id);
    if (!row) return biz;
    if (typeof body.name === "string") row.name = body.name.trim();
    if (typeof body.websiteUrl === "string") row.websiteUrl = body.websiteUrl.trim();
    if (body.appearance) {
      row.appearance = { ...row.appearance, ...body.appearance };
    }
    return row;
  });

  return NextResponse.json({ business: updated });
}
