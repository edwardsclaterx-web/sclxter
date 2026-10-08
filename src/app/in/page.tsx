import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { BlankEntry } from "./blank-entry";

export const metadata = { title: "\u00a0", robots: { index: false, follow: false } };

export default async function InPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div className="p-3">
      <BlankEntry />
    </div>
  );
}
