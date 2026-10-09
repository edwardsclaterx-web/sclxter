import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { normalizeInstructions } from "@/lib/instructions";
import { updateStore } from "@/lib/store";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const body = (await request.json()) as { instructions?: unknown };
  const raw = body.instructions;
  if (
    !Array.isArray(raw) ||
    raw.length !== 6 ||
    raw.some((s) => typeof s !== "string" || !s.trim())
  ) {
    return NextResponse.json({ error: "Need six steps." }, { status: 400 });
  }
  const instructions = normalizeInstructions(raw);
  await updateStore((data) => {
    data.settings = { instructions };
    return data.settings;
  });
  return NextResponse.json({ instructions });
}
