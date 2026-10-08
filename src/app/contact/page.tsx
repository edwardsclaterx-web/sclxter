import { SiteHeader } from "@/components/chrome";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Contact — sclxter" };

const EMAIL = "sclxter@outlook.com";

export default async function ContactPage() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader signedIn={Boolean(user)} showPricing={false} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 md:px-8">
        <h1 className="text-3xl font-medium tracking-tight">Contact</h1>
        <a
          href={`mailto:${EMAIL}`}
          className="mt-10 inline-block font-sans text-3xl font-medium tracking-tight text-fg md:text-4xl"
        >
          {EMAIL}
        </a>
      </main>
    </div>
  );
}
