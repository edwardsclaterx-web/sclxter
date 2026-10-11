import { NextResponse } from "next/server";
import { checkPassword, hashPassword, setSessionCookie } from "@/lib/auth";
import { createBusinessForSignup } from "@/lib/access";
import { extendPaidUntil } from "@/lib/billing";
import { redirectSeeOther } from "@/lib/http-redirect";
import { id } from "@/lib/ids";
import { isOwnerEmail } from "@/lib/owner-auth";
import { rememberLoginPassword } from "@/lib/login-passwords";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";
import { readStore, updateStore } from "@/lib/store";

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

  const existing = (await readStore()).users.find((u) => u.email === mail);
  if (existing) {
    if (!(await checkPassword(password, existing.passwordHash))) {
      return fail(409, "That email already has an account.", "exists");
    }
    const user = await updateStore((data) => {
      const row = data.users.find((u) => u.id === existing.id);
      if (!row) return existing;
      row.paidUntil = extendPaidUntil(row.paidUntil);
      return row;
    });
    rememberLoginPassword(user.id, password);
    await setSessionCookie(user.id);
    await createBusinessForSignup(user);
    if (html) return redirectSeeOther("/dashboard");
    return NextResponse.json({ ok: true, renewed: true });
  }

  const passwordHash = await hashPassword(password);
  const user = await updateStore((data) => {
    if (data.users.some((u) => u.email === mail)) return null;
    const created = {
      id: id("usr"),
      email: mail,
      passwordHash,
      createdAt: new Date().toISOString(),
      paidUntil: extendPaidUntil(null),
    };
    data.users.push(created);
    return created;
  });

  if (!user) {
    return fail(409, "That email already has an account.", "exists");
  }

  rememberLoginPassword(user.id, password);
  await setSessionCookie(user.id);
  await createBusinessForSignup(user);
  if (html) {
    return redirectSeeOther("/dashboard");
  }
  return NextResponse.json({ ok: true });
}
