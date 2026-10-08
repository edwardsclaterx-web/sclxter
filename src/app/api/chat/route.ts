import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { answerChat, parseLeadFromReply, SCLXTER_SITE_ID } from "@/lib/groq";
import { groqKeyPresent } from "@/lib/secrets";
import { id } from "@/lib/ids";
import { DEMO_PUBLIC_ID } from "@/lib/seed";
import { readStore, updateStore } from "@/lib/store";
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
  const body = (await request.json()) as { messages?: ChatMessage[] };
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
      return cors(
        NextResponse.json(
          { error: "The assistant had a problem. Try again in a moment." },
          { status: 502 },
        ),
      );
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
  }

  const knowledge = data.knowledge.filter(
    (k) =>
      k.businessId === business.id && (!ownerTest || k.source === "note"),
  );

  try {
    const barber =
      !ownerTest &&
      (business.publicId === DEMO_PUBLIC_ID || business.id === "biz_northgate");
    const raw = await answerChat({
      business,
      knowledge,
      messages,
      barber,
      notesOnly: ownerTest,
    });
    const { text, lead } = parseLeadFromReply(raw);
    if (lead) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      await updateStore((store) => {
        store.leads.push({
          id: id("lead"),
          businessId: business!.id,
          name: "From chat",
          phone: "",
          email: "",
          message: lastUser?.content ?? text,
          createdAt: new Date().toISOString(),
        });
      });
    }
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
    return cors(
      NextResponse.json(
        { error: "The assistant had a problem. Try again in a moment." },
        { status: 502 },
      ),
    );
  }
}
