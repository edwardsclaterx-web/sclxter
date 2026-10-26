import type { ReactNode } from "react";
import { ensureIndustryBriefing } from "@/lib/industry-briefing";
import { DEMO_PUBLIC_ID } from "@/lib/seed";
import { readStore } from "@/lib/store";
import { AskAnything } from "./ask-anything";

export const dynamic = "force-dynamic";

export default async function DemoLayout({ children }: { children: ReactNode }) {
  try {
    const data = await readStore();
    const demo = data.businesses.find((b) => b.publicId === DEMO_PUBLIC_ID);
    if (demo) void ensureIndustryBriefing(demo);
  } catch {
    /* demo page still renders if shop data is unavailable */
  }

  return (
    <>
      <div className="relative z-0">{children}</div>
      <AskAnything />
    </>
  );
}
