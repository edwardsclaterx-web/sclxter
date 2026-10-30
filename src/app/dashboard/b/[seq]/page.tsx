import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getBusinessBySeq, isAdmin, toClientBusiness } from "@/lib/access";
import { normalizeInstructions } from "@/lib/instructions";
import { readStore } from "@/lib/store";
import { BusinessScreen } from "../../business-screen";

export default async function AdminBusinessPage({
  params,
}: {
  params: Promise<{ seq: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!isAdmin(user)) redirect("/dashboard");

  const { seq: raw } = await params;
  const seq = Number(raw);
  if (!Number.isInteger(seq) || seq < 0) notFound();
  const biz = await getBusinessBySeq(seq);
  if (!biz) notFound();

  const data = await readStore();
  const owner = data.users.find((u) => u.id === biz.ownerId);

  return (
    <BusinessScreen
      admin
      business={toClientBusiness(biz, {
        admin: true,
        ownerEmail: owner?.email,
      })}
      instructions={normalizeInstructions(data.settings?.instructions)}
    />
  );
}
