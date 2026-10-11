import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, listedBusinesses } from "@/lib/access";
import { readStore } from "@/lib/store";
import { BusinessesList } from "./list-client";

export default async function BusinessesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const data = await readStore();
  const rows = listedBusinesses(data).map((b) => {
    const owner = data.users.find((u) => u.id === b.ownerId);
    return {
      seq: b.seq,
      name: b.name,
      websiteUrl: b.websiteUrl,
      industry: b.industry,
      contactPhone: b.contactPhone,
      contactEmail: b.contactEmail,
      contactOther: b.contactOther,
      ownerEmail: owner?.email ?? "",
      createdAt: owner?.createdAt || b.createdAt,
    };
  });

  return <BusinessesList rows={rows} />;
}
