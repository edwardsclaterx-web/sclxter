import { NextResponse } from "next/server";
import { checkPassword, hashPassword, setSessionCookie } from "@/lib/auth";
import { afterAuthPath, createBusinessForSignup } from "@/lib/access";
import { redirectSeeOther } from "@/lib/http-redirect";
import { id } from "@/lib/ids";
import { isOwnerEmail, isOwnerLogin } from "@/lib/owner-auth";
import { readLoginBody, wantsHtml } from "@/lib/read-login-body";
import { isLeavesakeLogin } from "@/lib/leavesake";
import { isNorthgateLogin } from "@/lib/northgate";
import { persistLastError } from "@/lib/persist";
import { readStore, updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, password, terms } = await readLoginBody(request);
  const html = wantsHtml(request);
  const fail = (status: number, error: string, code: string) => {
    if (html) {
      return redirectSeeOther(`/account?signup=${code}`);
    }
    return NextResponse.json({ error }, { status });
  };

  const mail = email.trim().toLowerCase();
  if (!terms) {
    return fail(
      400,
      "Accept the Terms of Service to create an account.",
      "terms",
    );
  }
  if (!mail.includes("@") || password.length < 8) {
    return fail(
      400,
      "Use a real email and a password of at least 8 characters.",
      "invalid",
    );
  }
  if (
    isOwnerLogin(mail) ||
    isOwnerEmail(mail) ||
    isNorthgateLogin(mail) ||
    isLeavesakeLogin(mail)
  ) {
    return fail(409, "That email already has an account.", "exists");
  }

  const existing = (await readStore()).users.find((u) => u.email === mail);
  if (existing) {
    if (!(await checkPassword(password, existing.passwordHash))) {
      return fail(409, "That email already has an account.", "exists");
    }
    const next = afterAuthPath(existing);
    const signedIn = html
      ? redirectSeeOther(next)
      : NextResponse.json({ ok: true, signedIn: true, next });
    await setSessionCookie(existing.id, signedIn, request);
    await createBusinessForSignup(existing);
    return signedIn;
  }

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await updateStore((data) => {
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
  } catch (err) {
    const detail =
      persistLastError() ||
      (err instanceof Error ? err.message : "Could not persist shop data.");
    return NextResponse.json({ error: "Could not save.", detail }, { status: 503 });
  }

  if (!user) {
    return fail(409, "That email already has an account.", "exists");
  }

  const createdRes = html
    ? redirectSeeOther("/account")
    : NextResponse.json({ ok: true, next: "/account" });
  await setSessionCookie(user.id, createdRes, request);
  try {
    await createBusinessForSignup(user);
  } catch (err) {
    const detail =
      persistLastError() ||
      (err instanceof Error ? err.message : "Could not persist shop data.");
    return NextResponse.json({ error: "Could not save.", detail }, { status: 503 });
  }
  return createdRes;
}
