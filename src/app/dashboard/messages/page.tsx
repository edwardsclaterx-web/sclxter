import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, listedBusinesses } from "@/lib/access";
import { readStore } from "@/lib/store";
import { MessagesInbox } from "./inbox-client";

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const data = await readStore();
  const rows = listedBusinesses(data).map((b) => {
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

  return <MessagesInbox rows={rows} />;
}
