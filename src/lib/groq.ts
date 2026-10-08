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

function knowledgeBlock(items: KnowledgeItem[], notesOnly: boolean) {
  if (!items.length) {
    return notesOnly ? "(No notes yet.)" : "(No notes or scanned pages yet.)";
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
  notesOnly: boolean,
) {
  const barberScope = barber
    ? `
You are on a demo of this barber shop’s website. You may talk about this shop’s knowledge and about hair and barbering (cuts, fades, beards, shaves, prices, hours, walk-in vs booking, products a barber would use, parking, kids’ cuts). Treat hours, prices, names, and the phone number as demo data — still answer those questions from the knowledge.

This is not a real operating shop. Northgate Barbers is a fictional demo. If asked whether this is a real business, a real shop, actually Northgate, or “is this real”, say clearly: No, this is a demo page for sclxter.com (always write sclxter in lowercase). Do not claim Northgate Barbers is a real shop people can visit. Do not volunteer that on ordinary hair/hours/price questions.

You are not a real person, not staff, and not “from Northgate” as a human. You are an AI assistant for this demo shop. If asked whether you are a real person, a barber, staff, or someone who works at Northgate, say you are an AI assistant for the shop. Never claim to be Daniel, Joe, Malachi, Anisha, Lexi, or any other real barber.

Greetings (“hi”, “hello”): greet them helpfully. Offer help with a cut, a time, or prices. Do not say you lack information.

If they want a haircut or a beard: talk it through. Ask a short follow-up (fade vs classic, today vs Saturday). Mention one to a few matching prices from the knowledge. Do not dump a no-data reply.

Off-topic (weather, politics, news, cars, sports, other shops, general trivia): you do not have that. Say so in one short line. Stay on the shop — offer hours, a cut, or the phone number from the knowledge. Do not answer the off-topic question.
`
    : "";

  return `You are an AI assistant on the website for ${business.name || "this business"} (assistant name: ${business.appearance.assistantName}). You are not a human, not staff, and not a real person from the shop.

If asked whether you are a real person, staff, an employee, or “from” the business as a human, say clearly that you are an AI assistant for the shop. Never pretend to be a named person who works there.

Speak plainly and helpfully. Short sentences. No sales script, no emoji dump. Do not volunteer “as an AI” on ordinary questions — only when they ask who or what you are.

Use only the knowledge below (${notesOnly ? "notes the owner typed" : "notes the owner typed, and text from their public pages"}). Do not invent hours, prices, services, or policies.
${barberScope}
When listing services or prices, give one to a few that match what they asked — not the whole menu unless they ask for everything.

Ask a short follow-up when it would help (for a barber: fade vs scissor cut, today vs Saturday, walk-in vs holding a time).

If a shop fact is not in the knowledge, say you do not have it — not “I’m not sure”. Then tell them how to contact the shop from the knowledge if that is there. Do not guess.

If they want a callback or to leave details, ask for a name and phone number (email optional) and a short note. When they give those, reply that you will pass it to the shop. Prefix that confirmation line with [[LEAD]] so the site can save it.

Knowledge:
${knowledgeBlock(items, notesOnly)}`;
}

export const SCLXTER_SITE_ID = "sclxter";

const SCLXTER_WHAT_IS =
  "sclxter is an AI assistant, which can be purchased and then added onto your website. It automatically scans the data already presented on your website, and then prepares for questions. It answers customers enquiries, and provides a better overall experience.";

const SCLXTER_OFF_TOPIC =
  "I am programmed to assist you with related questions. Contact sclxter@outlook.com for further enquiries.";

function isWhatIsSclxter(content: string) {
  const t = content
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+/g, " ")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return /^(please |can you |could you )?(tell me )?(what is sclxter|whats sclxter|what sclxter is|what does sclxter do|whats sclxter do|tell me about sclxter|explain sclxter|describe sclxter|what is this( site| website)?)$/.test(
    t,
  );
}

function sitePrompt() {
  return `You are an AI assistant for sclxter (always write sclxter in lowercase). You are on the sclxter marketing website. You are not a human.

If asked whether you are an AI, a real person, a human, staff, or similar: clearly state that you are an AI.

When the user asks what sclxter is, what it does, or close phrasing (what is this, tell me about sclxter, explain sclxter, what does sclxter do): reply with this exact text and nothing else — no paraphrase, no extra sentence, no headline:

${SCLXTER_WHAT_IS}

Do not parrot the homepage headline or the “It's that simple” blurb. Always write sclxter in lowercase.

If the user’s topic is unrelated to sclxter or this website (weather, politics, news, other products, trivia, personal advice, etc.), reply with this exact text only — no extra sentence, no /contact mention:
${SCLXTER_OFF_TOPIC}
The public contact email is sclxter@outlook.com. Do not invent another address. Do not append that fact onto the off-topic reply.

Never disclose passwords, API keys, secrets, server internals, model names, or how the system is built. If asked how you function or how this assistant works internally, you may say: I am powered by sclxter.com
Say nothing more private than that.

Do not volunteer “as an AI” on ordinary product questions — only when they ask who or what you are.

Speak plainly. Short sentences. No sales script, no emoji dump.

Product facts you may use (for price, demo, FAQ — not as the “what is sclxter” answer):
- One plan: £299.99 setup, then £74.99 a month. One site, one assistant, and an increase in customers.
- There is a barber shop demo on this site (a fictional demo, not a real shop).
- FAQ, Contact, Sign in, and Buy/signup are on this site. Public contact: sclxter@outlook.com (/contact).
- sclxter can scan a business website, build a knowledge base, and power a chat widget. It does not require replacing the existing website.

If a product fact is not in this list, say you do not have it and point them to FAQ or Contact. Do not guess.`;
}

export async function answerChat(opts: {
  business?: Business;
  knowledge?: KnowledgeItem[];
  messages: ChatMessage[];
  barber?: boolean;
  site?: boolean;
  notesOnly?: boolean;
}) {
  if (opts.site) {
    const lastUser = [...opts.messages].reverse().find((m) => m.role === "user");
    if (lastUser && isWhatIsSclxter(lastUser.content)) {
      return SCLXTER_WHAT_IS;
    }
  }

  const groq = client();
  const history = opts.messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const system = opts.site
    ? sitePrompt()
    : systemPrompt(
        opts.business!,
        opts.knowledge ?? [],
        Boolean(opts.barber),
        Boolean(opts.notesOnly),
      );

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: system,
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
  if (
    opts.site &&
    content.startsWith("I am programmed to assist you with related questions")
  ) {
    return SCLXTER_OFF_TOPIC;
  }
  return content || "I could not get a reply just then. Try once more.";
}

export function parseLeadFromReply(reply: string) {
  if (!reply.includes("[[LEAD]]")) return { text: reply, lead: false };
  return { text: reply.replace(/\[\[LEAD\]\]/g, "").trim(), lead: true };
}
