import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Buy — sclxter" };

export default async function BuyPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={false} showPricing={false} showBuy />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="text-base leading-7 text-fg">
          Sign in / create an account before purchasing a sclxter assistant.
          This way you can link it and customise it through the email you
          sign in with.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-10 items-center justify-center bg-accent px-4 text-sm text-accent-fg"
        >
          Sign in
        </Link>
      </main>
    </div>
  );
}
