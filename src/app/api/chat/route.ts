import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { nextConversationSeq } from "@/lib/access";
import {
  appOriginFromRequest,
  publicEmbedGate,
  readEmbedFrom,
  TRY_AGAIN,
} from "@/lib/embed-host";
import { answerChat, parseLeadFromReply, SCLXTER_SITE_ID } from "@/lib/groq";
import { recordKnowledgeGap } from "@/lib/knowledge-gaps";
import { groqKeyPresent } from "@/lib/secrets";
import { id } from "@/lib/ids";
import { DEMO_PUBLIC_ID } from "@/lib/seed";
import { readStore, updateStore } from "@/lib/store";
import { TEST_AI_BLOCKED, businessReadyForTest } from "@/lib/test-ai";
import type { ChatMessage } from "@/lib/types";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  if (!groqKeyPresent()) {
    return cors(
      NextResponse.json(
        { error: "The assistant is not configured on this server." },
        { status: 503 },
      ),
    );
  }

  const url = new URL(request.url);
  const publicId = url.searchParams.get("publicId");
  const site = url.searchParams.get("site");
  const body = (await request.json()) as {
    messages?: ChatMessage[];
    conversationId?: unknown;
    from?: unknown;
  };
  const pageOrigin = readEmbedFrom(request, body);
  const messages = (body.messages ?? []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && m.content,
  );
  if (!messages.length) {
    return cors(
      NextResponse.json({ error: "Ask a question first." }, { status: 400 }),
    );
  }

  const isSite =
    site === SCLXTER_SITE_ID || publicId === SCLXTER_SITE_ID;

  if (isSite) {
    const app = appOriginFromRequest(request);
    if (pageOrigin && pageOrigin !== app) {
      return cors(
        NextResponse.json(
          { error: "This assistant is not available on this site." },
          { status: 403 },
        ),
      );
    }
    try {
      const raw = await answerChat({ messages, site: true });
      const { text } = parseLeadFromReply(raw);
      return cors(NextResponse.json({ reply: text }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "GROQ_UNCONFIGURED") {
        return cors(
          NextResponse.json(
            { error: "The assistant is not configured on this server." },
            { status: 503 },
          ),
        );
      }
      return cors(NextResponse.json({ reply: TRY_AGAIN }));
    }
  }

  const data = await readStore();
  let business = publicId
    ? data.businesses.find((b) => b.publicId === publicId)
    : null;

  const user = !business ? await getSessionUser() : null;
  const ownerTest = Boolean(user) && !publicId;

  if (!business) {
    if (!user) {
      return cors(
        NextResponse.json({ error: "Unknown assistant." }, { status: 404 }),
      );
    }
    business = await getOrCreateBusiness(user);
    if (!business) {
      return cors(
        NextResponse.json({ error: "Unknown assistant." }, { status: 404 }),
      );
    }
  }

  if (!ownerTest) {
    const gate = publicEmbedGate(request, business, data, pageOrigin);
    if (!gate.ok) {
      return cors(
        NextResponse.json({ error: gate.error }, { status: gate.status }),
      );
    }
  }

  if (ownerTest && !businessReadyForTest(business)) {
    return cors(
      NextResponse.json({ error: TEST_AI_BLOCKED }, { status: 400 }),
    );
  }

  const shop = business;
  const knowledge = data.knowledge.filter((k) => k.businessId === shop.id);

  try {
    const barber =
      !ownerTest &&
      (shop.publicId === DEMO_PUBLIC_ID || shop.id === "biz_northgate");
    const raw = await answerChat({
      business: shop,
      knowledge,
      messages,
      barber,
      notesOnly: ownerTest,
    });
    const { text, lead, gap } = parseLeadFromReply(raw);
    const asked =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (gap) await recordKnowledgeGap(shop.id, asked);
    const thread = [...messages, { role: "assistant" as const, content: text }];
    const persist = !ownerTest;
    let conversationId =
      typeof body.conversationId === "string" ? body.conversationId : "";

    if (persist) {
      const now = new Date().toISOString();
      const saved = await updateStore((store) => {
        let convo = conversationId
          ? store.conversations.find(
              (c) =>
                c.id === conversationId && c.businessId === shop.id,
            )
          : undefined;
        if (!convo) {
          convo = {
            id: id("convo"),
            businessId: shop.id,
            seq: nextConversationSeq(store, shop.id),
            messages: thread,
            lead: Boolean(lead),
            createdAt: now,
            updatedAt: now,
          };
          store.conversations.push(convo);
        } else {
          convo.messages = thread;
          convo.updatedAt = now;
          if (lead) convo.lead = true;
        }
        if (lead) {
          store.leads.push({
            id: id("lead"),
            businessId: shop.id,
            conversationId: convo.id,
            name: "From chat",
            phone: "",
            email: "",
            message:
              [...messages].reverse().find((m) => m.role === "user")
                ?.content ?? text,
            createdAt: now,
          });
        }
        return convo.id;
      });
      conversationId = saved;
    }

    return cors(
      NextResponse.json({
        reply: text,
        ...(conversationId ? { conversationId } : {}),
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "GROQ_UNCONFIGURED") {
      return cors(
        NextResponse.json(
          { error: "The assistant is not configured on this server." },
          { status: 503 },
        ),
      );
    }
    return cors(
      NextResponse.json({ reply: TRY_AGAIN }),
    );
  }
}
