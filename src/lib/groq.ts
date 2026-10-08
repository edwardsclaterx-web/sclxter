import Groq from "groq-sdk";
import { loadSecrets } from "./secrets";
import type { Business, ChatMessage, KnowledgeItem } from "./types";

const MODEL = "openai/gpt-oss-20b";

function client() {
  loadSecrets();
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_UNCONFIGURED");
  return new Groq({ apiKey: key });
}

function knowledgeBlock(items: KnowledgeItem[]) {
  if (!items.length) {
    return "(No notes or scanned pages yet.)";
  }
  return items
    .map((item) => {
      const where = item.url ? ` [${item.url}]` : "";
      return `### ${item.title}${where}\n${item.body}`;
    })
    .join("\n\n");
}

function systemPrompt(
  business: Business,
  items: KnowledgeItem[],
  barber: boolean,
) {
  const barberScope = barber
    ? `
You are on this barber shop’s website. You may talk about this shop’s knowledge and about hair and barbering (cuts, fades, beards, shaves, prices, hours, walk-in vs booking, products a barber would use, parking, kids’ cuts).

Greetings (“hi”, “hello”): greet them like someone in the shop. Offer help with a cut, a time, or prices. Do not say you lack information.

If they want a haircut or a beard: talk it through. Ask a short follow-up (fade vs classic, today vs Saturday). Mention one to a few matching prices from the knowledge. Do not dump a no-data reply.

Off-topic (weather, politics, news, cars, sports, other shops, general trivia): you do not have that. Say so in one short line. Stay on the shop — offer hours, a cut, or the phone number from the knowledge. Do not answer the off-topic question.
`
    : "";

  return `You are the website assistant for ${business.name || "this business"}, speaking as ${business.appearance.assistantName}.

Speak like a normal, helpful person. Short sentences. No sales script, no emoji dump, no “as an AI”.

Use only the knowledge below (notes the owner typed, and text from their public pages). Do not invent hours, prices, services, or policies.
${barberScope}
When listing services or prices, give one to a few that match what they asked — not the whole menu unless they ask for everything.

Ask a short follow-up when it would help (for a barber: fade vs scissor cut, today vs Saturday, walk-in vs holding a time).

If a shop fact is not in the knowledge, say you do not have it — not “I’m not sure”. Then tell them how to contact the shop from the knowledge if that is there. Do not guess.

If they want a callback or to leave details, ask for a name and phone number (email optional) and a short note. When they give those, reply that you will pass it to the shop. Prefix that confirmation line with [[LEAD]] so the site can save it.

Knowledge:
${knowledgeBlock(items)}`;
}

export async function answerChat(opts: {
  business: Business;
  knowledge: KnowledgeItem[];
  messages: ChatMessage[];
  barber?: boolean;
}) {
  const groq = client();
  const history = opts.messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: systemPrompt(
          opts.business,
          opts.knowledge,
          Boolean(opts.barber),
        ),
      },
      ...history,
    ],
  });

  const message = completion.choices[0]?.message;
  const content =
    (typeof message?.content === "string" && message.content.trim()) ||
    (typeof (message as { reasoning?: string } | undefined)?.reasoning ===
      "string" &&
      (message as { reasoning?: string }).reasoning?.trim()) ||
    "";
  return content || "I could not get a reply just then. Try once more.";
}

export function parseLeadFromReply(reply: string) {
  if (!reply.includes("[[LEAD]]")) return { text: reply, lead: false };
  return { text: reply.replace(/\[\[LEAD\]\]/g, "").trim(), lead: true };
}
