import { NextResponse } from "next/server";
import {
  checkPassword,
  getOrCreateBusiness,
  setSessionCookie,
} from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const data = await readStore();
  const user = data.users.find((u) => u.email === email);
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Email or password is wrong." },
      { status: 401 },
    );
  }
  await setSessionCookie(user.id);
  await getOrCreateBusiness(user);
  return NextResponse.json({ ok: true });
}
