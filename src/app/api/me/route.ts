import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser, publicUser } from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const business = await getOrCreateBusiness(user);
  const data = await readStore();
  const knowledge = data.knowledge.filter((k) => k.businessId === business.id);
  const leads = data.leads
    .filter((l) => l.businessId === business.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({
    user: publicUser(user),
    business,
    knowledge,
    leads,
  });
}
