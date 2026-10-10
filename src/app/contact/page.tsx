import { SiteHeader } from "@/components/chrome";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { findOwnerBusiness } from "@/lib/support";
import { readStore } from "@/lib/store";
import { OwnerSupport } from "./owner-support";

export const metadata = { title: "Contact — sclxter" };

const EMAIL = "sclxter@outlook.com";

export default async function ContactPage() {
  const user = await getSessionUser();
  const data = user ? await readStore() : null;
  const owned = Boolean(
    user && !isAdmin(user) && data && findOwnerBusiness(user, data),
  );
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
        {owned && <OwnerSupport />}
      </main>
    </div>
  );
}
