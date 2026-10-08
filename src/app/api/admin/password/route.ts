import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { isAdmin, resolveBusiness } from "@/lib/access";
import { updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const body = (await request.json()) as { seq?: number; password?: string };
  const seq = typeof body.seq === "number" ? body.seq : null;
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Use at least 8 characters." },
      { status: 400 },
    );
  }
  const biz = await resolveBusiness(user, seq);
  if (!biz || !biz.ownerId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const passwordHash = await hashPassword(password);
  const ok = await updateStore((data) => {
    const owner = data.users.find((u) => u.id === biz.ownerId);
    if (!owner) return false;
    owner.passwordHash = passwordHash;
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
