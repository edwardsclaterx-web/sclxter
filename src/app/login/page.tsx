import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser, hasOwnerStep2Pending } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  if (await hasOwnerStep2Pending()) redirect("/in");
  const q = await searchParams;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        signedIn={false}
        showPricing={false}
        tail={
          <Link href="/signup" className="text-fg">
            Create account
          </Link>
        }
      />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Email and password.</p>
        <AuthForm
          mode="login"
          error={q.error ? "Those details did not match." : null}
        />
      </main>
    </div>
  );
}
