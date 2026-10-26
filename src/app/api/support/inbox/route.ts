import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, messageableBusinesses } from "@/lib/access";
import { readStore } from "@/lib/store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data = await readStore();
  const rows = messageableBusinesses(data).map((b) => {
    const thread = data.supportThreads.find((t) => t.businessId === b.id);
    const last = thread?.messages[thread.messages.length - 1];
    return {
      seq: b.seq,
      name: b.name,
      unread: (thread?.adminUnread ?? 0) > 0,
      updatedAt: thread?.updatedAt ?? b.createdAt,
      lastPreview: last?.content ?? "",
    };
  });
  return NextResponse.json({ rows });
}
