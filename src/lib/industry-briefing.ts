import "server-only";

import { generateIndustryBriefing } from "./groq";
import { groqKeyPresent } from "./secrets";
import { updateStore } from "./store";
import type { Business } from "./types";

const inflight = new Map<string, Promise<Business>>();

function industryKey(industry: string) {
  return industry.trim();
}

export async function ensureIndustryBriefing(biz: Business): Promise<Business> {
  const industry = industryKey(biz.industry);
  if (!industry) {
    if (!biz.industryBriefing && !biz.industryBriefingFor) return biz;
    return updateStore((data) => {
      const row = data.businesses.find((b) => b.id === biz.id);
      if (!row) return biz;
      row.industryBriefing = "";
      row.industryBriefingFor = "";
      return row;
    });
  }

  if (
    (biz.industryBriefing || "").trim() &&
    biz.industryBriefingFor === industry
  ) {
    return biz;
  }

  const existing = inflight.get(biz.id);
  if (existing) return existing;

  const run = (async () => {
    if (!groqKeyPresent()) return biz;
    try {
      const text = await generateIndustryBriefing(industry);
      return updateStore((data) => {
        const row = data.businesses.find((b) => b.id === biz.id);
        if (!row) return biz;
        if (industryKey(row.industry) !== industry) return row;
        row.industryBriefing = text;
        row.industryBriefingFor = industry;
        return row;
      });
    } catch {
      return biz;
    }
  })();

  inflight.set(biz.id, run);
  try {
    return await run;
  } finally {
    inflight.delete(biz.id);
  }
}
