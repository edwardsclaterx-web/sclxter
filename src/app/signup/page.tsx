import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

const SIGNUP_ERRORS: Record<string, string> = {
  invalid: "Use a real email and a password of at least 8 characters.",
  exists: "That email already has an account.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const q = await searchParams;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={false} showPricing={false} showBuy />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted">
          One business per account.
        </p>
        <AuthForm
          mode="signup"
          error={q.error ? SIGNUP_ERRORS[q.error] || SIGNUP_ERRORS.invalid : null}
        />
      </main>
    </div>
  );
}
