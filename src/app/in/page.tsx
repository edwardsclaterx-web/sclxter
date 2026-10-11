import { redirect } from "next/navigation";
import { getSessionUser, hasOwnerStep2Pending } from "@/lib/auth";
import { OwnerLoginForm } from "../owner-login-form";
import { BlankEntry } from "./blank-entry";

export const metadata = { title: "\u00a0", robots: { index: false, follow: false } };

export default async function InPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const q = await searchParams;
  if (await hasOwnerStep2Pending()) {
    return (
      <div className="p-3">
        <BlankEntry />
      </div>
    );
  }
  return (
    <div className="p-3">
      <OwnerLoginForm
        error={q.error ? "Those details did not match." : null}
      />
    </div>
  );
}
