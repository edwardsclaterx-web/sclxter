import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { createBusinessForSignup } from "@/lib/access";
import { redirectSeeOther } from "@/lib/http-redirect";
import { id } from "@/lib/ids";
import { isOwnerEmail } from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";
import { updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const { email, password } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string, code: string) => {
    if (html) {
      return redirectSeeOther(`/signup?error=${code}`);
    }
    return NextResponse.json({ error }, { status });
  };

  const mail = email.trim().toLowerCase();
  if (!mail.includes("@") || password.length < 8) {
    return fail(
      400,
      "Use a real email and a password of at least 8 characters.",
      "invalid",
    );
  }
  if (isOwnerEmail(mail)) {
    return fail(409, "That email already has an account.", "exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await updateStore((data) => {
    if (data.users.some((u) => u.email === mail)) return null;
    const created = {
      id: id("usr"),
      email: mail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    data.users.push(created);
    return created;
  });

  if (!user) {
    return fail(409, "That email already has an account.", "exists");
  }

  await setSessionCookie(user.id);
  await createBusinessForSignup(user);
  if (html) {
    return redirectSeeOther("/dashboard");
  }
  return NextResponse.json({ ok: true });
}
