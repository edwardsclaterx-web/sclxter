import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser, hasOwnerStep2Pending } from "@/lib/auth";
import { OwnerLoginForm } from "../owner-login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const secondStep = await hasOwnerStep2Pending();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        signedIn={false}
        showPricing={false}
        extra={
          <Link href="/signup" className="text-fg">
            Create account
          </Link>
        }
      />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          {secondStep
            ? "Enter the second password to continue."
            : "Email and first password."}
        </p>
        <OwnerLoginForm secondStep={secondStep} />
      </main>
    </div>
  );
}
