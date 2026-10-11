import "server-only";

import { id } from "./ids";
import { updateStore } from "./store";
import type { KnowledgeGap } from "./types";

const STOP = new Set([
  "can",
  "i",
  "a",
  "an",
  "the",
  "do",
  "you",
  "guys",
  "get",
  "have",
  "to",
  "for",
  "is",
  "are",
  "my",
  "we",
  "your",
  "me",
  "please",
  "would",
  "like",
  "want",
  "does",
  "of",
  "on",
  "in",
  "it",
  "this",
  "that",
  "and",
  "or",
  "with",
  "any",
  "also",
]);

function tokens(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/s$/, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

export function clusterKey(question: string) {
  return [...new Set(tokens(question))].sort().join(" ");
}

function overlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const set = new Set(a);
  let hit = 0;
  for (const t of b) if (set.has(t)) hit += 1;
  return hit / Math.max(a.length, b.length);
}

function looksLikeGap(text: string) {
  return /do not have that shop detail|has not listed|not listed that|exact (price|hours|polic)/i.test(
    text,
  );
}

export function parseAssistantReply(reply: string) {
  const lead = reply.includes("[[LEAD]]");
  const marked = reply.includes("[[GAP]]");
  const text = reply
    .replace(/\[\[LEAD\]\]/g, "")
    .replace(/\[\[GAP\]\]/g, "")
    .trim();
  return { text, lead, gap: marked || looksLikeGap(text) };
}

export async function recordKnowledgeGap(
  businessId: string,
  question: string,
) {
  const raw = question.trim();
  if (!raw || !businessId) return;
  const key = clusterKey(raw);
  if (!key) return;
  const now = new Date().toISOString();
  const incoming = tokens(raw);
  await updateStore((data) => {
    data.knowledgeGaps = data.knowledgeGaps ?? [];
    const rows = data.knowledgeGaps.filter((g) => g.businessId === businessId);
    let match = rows.find((g) => g.key === key);
    if (!match) {
      match = rows.find((g) => overlap(tokens(g.key), incoming) >= 0.6);
    }
    if (match) {
      match.count += 1;
      match.updatedAt = now;
      if (!match.question) match.question = raw;
      return match;
    }
    const created: KnowledgeGap = {
      id: id("gap"),
      businessId,
      key,
      question: raw,
      count: 1,
      createdAt: now,
      updatedAt: now,
    };
    data.knowledgeGaps.push(created);
    return created;
  });
}

export function topGapsForBusiness(
  gaps: KnowledgeGap[] | undefined,
  businessId: string,
) {
  return (gaps ?? [])
    .filter((g) => g.businessId === businessId)
    .sort((a, b) => b.count - a.count || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
}
