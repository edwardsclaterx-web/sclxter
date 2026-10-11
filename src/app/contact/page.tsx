import { AppHeader } from "@/components/app-header";
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
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 md:px-8">
        <h1 className="text-3xl font-medium tracking-tight">Contact</h1>
        <a
          href={`mailto:${EMAIL}`}
          className="mt-10 inline-block font-sans text-3xl font-medium tracking-tight text-fg md:text-4xl"
        >
          {EMAIL}
        </a>
        {owned ? (
          <OwnerSupport />
        ) : (
          <p className="mt-8 max-w-2xl text-sm leading-6 text-muted">
            Buying a sclxter assistant also unlocks a priority chat on this
            site. That chat is between real people only (no AIs), and is there
            if you have questions or problems after you have an assistant. You
            can email instead; the chat is usually the clearer route.
          </p>
        )}
      </main>
    </div>
  );
}
