import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={false} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Email and password. No card.
        </p>
        <AuthForm mode="login" />
      </main>
    </div>
  );
}
