import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, messageableBusinesses } from "@/lib/access";
import { readStore } from "@/lib/store";
import { MessagesInbox } from "./inbox-client";

function lastWhen(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  if (sameDay) return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!isAdmin(user)) redirect("/dashboard");

  const data = await readStore();
  const rows = messageableBusinesses(data).map((b) => {
    const thread = data.supportThreads.find((t) => t.businessId === b.id);
    const last = thread?.messages[thread.messages.length - 1];
    return {
      seq: b.seq,
      name: b.name,
      unread: (thread?.adminUnread ?? 0) > 0,
      updatedAt: thread?.updatedAt ?? b.createdAt,
      lastWhen: lastWhen(last?.createdAt),
      lastPreview: last?.content ?? "",
    };
  });

  return <MessagesInbox rows={rows} />;
}
