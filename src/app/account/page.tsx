export const dynamic = "force-dynamic";

import { AppHeader } from "@/components/app-header";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";
import { AccountPanel } from "./account-panel";

export const metadata = { title: "Account — sclxter" };

const SIGNUP_ERRORS: Record<string, string> = {
  invalid: "Use a real email and a password of at least 8 characters.",
  exists: "That email already has an account.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signup?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    return (
      <div className="flex min-h-full flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
          <h1 className="text-2xl font-medium tracking-tight">Account</h1>
          <AccountPanel email={user.email} />
        </main>
      </div>
    );
  }

  const q = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={false} showPricing={false} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Account</h1>

        <section id="signin" className="mt-10">
          <h2 className="text-xl font-medium tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-muted">Email and password.</p>
          <AuthForm
            mode="login"
            error={q.error ? "Those details did not match." : null}
          />
        </section>

        <section id="signup" className="mt-16">
          <h2 className="text-xl font-medium tracking-tight">Create account</h2>
          <p className="mt-2 text-sm text-muted">One business per account.</p>
          <AuthForm
            mode="signup"
            error={
              q.signup ? SIGNUP_ERRORS[q.signup] || SIGNUP_ERRORS.invalid : null
            }
          />
        </section>
      </main>
    </div>
  );
}
