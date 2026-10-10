import "server-only";

import { id } from "./ids";
import { listedBusinesses } from "./access";
import { readStore, updateStore } from "./store";
import type { Business, SupportMessage, SupportThread, User } from "./types";

export function findOwnerBusiness(user: User, data: Awaited<ReturnType<typeof readStore>>) {
  return listedBusinesses(data).find((b) => b.ownerId === user.id) ?? null;
}

export function threadForBusiness(
  data: Awaited<ReturnType<typeof readStore>>,
  businessId: string,
) {
  return data.supportThreads.find((t) => t.businessId === businessId) ?? null;
}

export async function getThreadForBusiness(businessId: string) {
  const data = await readStore();
  return threadForBusiness(data, businessId);
}

export async function appendSupportMessage(opts: {
  business: Business;
  from: SupportMessage["from"];
  content: string;
}): Promise<SupportThread | null> {
  const content = opts.content.trim();
  if (!content) return null;
  const ownerId = opts.business.ownerId;
  if (!ownerId) return null;
  const now = new Date().toISOString();
  return updateStore((data) => {
    let thread = data.supportThreads.find((t) => t.businessId === opts.business.id);
    if (!thread) {
      thread = {
        id: id("sup"),
        businessId: opts.business.id,
        ownerId,
        messages: [],
        ownerUnread: 0,
        adminUnread: 0,
        createdAt: now,
        updatedAt: now,
      };
      data.supportThreads.push(thread);
    }
    thread.messages.push({
      id: id("smsg"),
      from: opts.from,
      content,
      createdAt: now,
    });
    thread.updatedAt = now;
    if (opts.from === "owner") thread.adminUnread += 1;
    else thread.ownerUnread += 1;
    return thread;
  });
}

export async function markSupportRead(
  businessId: string,
  who: "owner" | "admin",
) {
  return updateStore((data) => {
    const thread = data.supportThreads.find((t) => t.businessId === businessId);
    if (!thread) return null;
    if (who === "owner") thread.ownerUnread = 0;
    else thread.adminUnread = 0;
    return thread;
  });
}

export function publicThread(thread: SupportThread | null) {
  return {
    messages: thread?.messages ?? [],
  };
}
