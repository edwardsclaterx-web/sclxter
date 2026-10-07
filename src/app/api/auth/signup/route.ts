import { NextResponse } from "next/server";
import {
  getOrCreateBusiness,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { id } from "@/lib/ids";
import { updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email.includes("@") || password.length < 8) {
    return NextResponse.json(
      { error: "Use a real email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await updateStore((data) => {
    if (data.users.some((u) => u.email === email)) return null;
    const created = {
      id: id("usr"),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    data.users.push(created);
    return created;
  });

  if (!user) {
    return NextResponse.json(
      { error: "That email already has an account." },
      { status: 409 },
    );
  }

  await setSessionCookie(user.id);
  await getOrCreateBusiness(user);
  return NextResponse.json({ ok: true });
}
