import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getBusinessBySeq, isAdmin, toClientBusiness } from "@/lib/access";
import { ensureIndustryBriefing } from "@/lib/industry-briefing";
import { normalizeInstructions } from "@/lib/instructions";
import { topGapsForBusiness } from "@/lib/knowledge-gaps";
import { readStore } from "@/lib/store";
import { BusinessScreen } from "../../business-screen";

export default async function AdminBusinessPage({
  params,
}: {
  params: Promise<{ seq: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const { seq: raw } = await params;
  const seq = Number(raw);
  if (!Number.isFinite(seq) || seq < 1) notFound();
  let biz = await getBusinessBySeq(seq);
  if (!biz) notFound();
  biz = await ensureIndustryBriefing(biz);

  const data = await readStore();
  const owner = data.users.find((u) => u.id === biz.ownerId);
  const conversations = data.conversations
    .filter((c) => c.businessId === biz.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const leads = data.leads
    .filter((l) => l.businessId === biz.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <BusinessScreen
      admin
      business={toClientBusiness(biz, {
        admin: true,
        ownerEmail: owner?.email,
      })}
      conversations={conversations.map((c) => ({
        seq: c.seq,
        lead: c.lead,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
        messages: c.messages,
      }))}
      leads={leads.map((l) => ({
        createdAt: l.createdAt,
        message: l.message,
      }))}
      gaps={topGapsForBusiness(data.knowledgeGaps, biz.id).map((g) => ({
        question: g.question,
      }))}
      instructions={normalizeInstructions(data.settings?.instructions)}
      asOf={Date.now()}
    />
  );
}
