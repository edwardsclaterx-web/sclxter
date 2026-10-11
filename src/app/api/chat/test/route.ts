import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveBusiness } from "@/lib/access";
import { answerChat, parseLeadFromReply } from "@/lib/groq";
import { recordKnowledgeGap } from "@/lib/knowledge-gaps";
import { TRY_AGAIN } from "@/lib/embed-host";
import { groqKeyPresent } from "@/lib/secrets";
import { ensureIndustryBriefing } from "@/lib/industry-briefing";
import { TEST_AI_BLOCKED, businessReadyForTest } from "@/lib/test-ai";
import type { ChatMessage } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const body = (await request.json()) as {
    messages?: ChatMessage[];
    seq?: number;
  };
  const seq = typeof body.seq === "number" ? body.seq : null;
  const biz = await resolveBusiness(user, seq);
  if (!biz) {
    return NextResponse.json({ error: TEST_AI_BLOCKED }, { status: 400 });
  }
  if (!businessReadyForTest(biz)) {
    return NextResponse.json({ error: TEST_AI_BLOCKED }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && m.content,
  );
  if (!messages.length) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  if (!groqKeyPresent()) {
    return NextResponse.json(
      { error: "The assistant is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    const ready = await ensureIndustryBriefing(biz);
    const raw = await answerChat({
      business: ready,
      knowledge: [],
      messages,
      notesOnly: true,
    });
    const { text, gap } = parseLeadFromReply(raw);
    const asked =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (gap) await recordKnowledgeGap(biz.id, asked);
    return NextResponse.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "GROQ_UNCONFIGURED") {
      return NextResponse.json(
        { error: "The assistant is not configured on this server." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: TRY_AGAIN }, { status: 502 });
  }
}
