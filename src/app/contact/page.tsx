import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Contact — SCLXTER" };

export default async function ContactPage() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 md:px-8">
        <h1 className="text-3xl font-medium tracking-tight">Contact</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Coming soon.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
