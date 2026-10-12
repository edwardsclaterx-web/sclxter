import Groq from "groq-sdk";
import { parseAssistantReply } from "./knowledge-gaps";
import { loadSecrets } from "./secrets";
import { toneById } from "./tones";
import type { Business, ChatMessage, KnowledgeItem } from "./types";

const MODEL = "openai/gpt-oss-20b";
const HISTORY = 8;
const RETRIEVE_CHARS = 1600;
const REPLY_LIMIT = 500;

function client() {
  loadSecrets();
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_UNCONFIGURED");
  return new Groq({ apiKey: key });
}

function norm(value: string) {
  return value
    .toLowerCase()
    .replace(/[?!.,]+/g, " ")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return norm(value)
    .split(" ")
    .filter((w) => w.length > 2);
}

function contactLine(business: Business) {
  const bits = [
    business.contactPhone,
    business.contactEmail,
    business.contactOther,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return bits.length ? bits.join(" · ") : "the shop";
}

function offTopicLine(contact: string) {
  return `I am programmed to assist you with related questions. Contact ${contact} for further enquiries.`;
}

export const SCLXTER_SITE_ID = "sclxter";

const SCLXTER_WHAT_IS =
  "sclxter is an AI assistant, which can be purchased and then added onto your website. It automatically scans the data already presented on your website, and then prepares for questions. It answers customers enquiries, and provides a better overall experience.";

const SCLXTER_CONTACT = "sclxter@outlook.com";
const SCLXTER_OFF_TOPIC = offTopicLine(SCLXTER_CONTACT);
const POWERED = "I am powered by sclxter.com";
const AI_LINE = "I am an AI, not a real person.";
const HELLO = "Hi, what can I help you with?";
const OUTPUT_RULE =
  "Output only the final answer the visitor should read. Never write planning, analysis, instruction recap, or phrases like User asks, According to instructions, We need to respond, We can say, or Let's craft.";

function isWhatIsSclxter(content: string) {
  return /^(please |can you |could you )?(tell me )?(what is sclxter|whats sclxter|what sclxter is|what does sclxter do|whats sclxter do|tell me about sclxter|explain sclxter|describe sclxter|what is this( site| website)?)$/.test(
    norm(content),
  );
}

function isAiAsk(content: string) {
  const t = norm(content);
  return (
    /\b(are you|r u|ru)\b/.test(t) &&
    /\b(ai|an ai|a i|artificial|bot|robot|human|real person|a person|real|staff|a human)\b/.test(
      t,
    )
  );
}

function isHowPowered(content: string) {
  const t = norm(content);
  return (
    /\b(how (do you|does (this|the )?(assistant|ai|it|you)|are you) (work|function)|what (model|llm|api|system) (are you|do you|is this)|powered by|your (prompt|instructions|system prompt)|are you (chatgpt|gpt|groq|claude|openai))\b/.test(
      t,
    ) || /^how (do|does) (you|this|it) work$/.test(t)
  );
}

function isGreeting(content: string) {
  return /^(hi|hello|hey|hiya|yo|howdy|good (morning|afternoon|evening)|whats up|what is up|how are you|hows it going)[\s!]*$/.test(
    norm(content),
  );
}

function isSiteRelated(content: string) {
  const t = norm(content);
  if (isGreeting(t) || isAiAsk(t) || isHowPowered(t) || isWhatIsSclxter(t)) {
    return true;
  }
  return /\b(sclxter|price|cost|buy|pay|paid|month|theme|tone|notepad|scan|widget|demo|faq|custom|customise|customize|stripe|setup|assistant|dashboard|embed|colour|color|billing|subscription)\b/.test(
    t,
  );
}

function isShopRelated(content: string, business: Business) {
  const t = norm(content);
  if (isGreeting(t) || isAiAsk(t) || isHowPowered(t) || isWhatIsSclxter(t)) {
    return true;
  }
  const name = norm(business.name || "");
  const industry = norm(business.industry || "");
  if (name && t.includes(name)) return true;
  if (industry && t.includes(industry)) return true;
  return /\b(hour|open|close|closed|price|cost|book|booking|appoint|cut|fade|beard|shave|service|menu|contact|phone|email|address|where|when|how much|walk in|walk-in|offer|do you)\b/.test(
    t,
  );
}

function countTrailingUnrelated(
  messages: ChatMessage[],
  related: (text: string) => boolean,
) {
  let n = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (related(m.content)) break;
    n += 1;
  }
  return n;
}

function chunkText(text: string) {
  return text
    .split(/\n(?=### )|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function scoreChunk(chunk: string, queryTokens: string[]) {
  const hay = norm(chunk);
  let score = 0;
  for (const tok of queryTokens) {
    if (hay.includes(tok)) score += tok.length > 5 ? 2 : 1;
  }
  return score;
}

function retrieveRelevant(source: string, query: string, limit = RETRIEVE_CHARS) {
  const chunks = chunkText(source);
  if (!chunks.length) return "";
  const q = tokens(query);
  const ranked = (
    q.length
      ? chunks
          .map((c) => ({ c, s: scoreChunk(c, q) }))
          .filter((row) => row.s > 0)
          .sort((a, b) => b.s - a.s)
      : chunks.slice(0, 2).map((c) => ({ c, s: 1 }))
  ).slice(0, 5);
  const pick = ranked.length
    ? ranked
    : chunks.slice(0, 1).map((c) => ({ c, s: 0 }));
  let out = "";
  for (const row of pick) {
    const next = out ? `${out}\n\n${row.c}` : row.c;
    if (next.length > limit) {
      if (!out) return row.c.slice(0, limit);
      break;
    }
    out = next;
  }
  return out;
}

function shopSource(business: Business, items: KnowledgeItem[], notesOnly: boolean) {
  const pad = (business.notepad || "").trim();
  if (pad) return pad;
  if (notesOnly || !items.length) return "";
  return items
    .map((item) => {
      const where = item.url ? ` [${item.url}]` : "";
      return `### ${item.title}${where}\n${item.body}`;
    })
    .join("\n\n");
}

function shopPrompt(
  business: Business,
  retrieved: string,
  contact: string,
  barber: boolean,
) {
  const tone = toneById(business.tone);
  const demo = barber
    ? "This shop is a fictional demo for sclxter.com. If asked whether the shop is real, say that."
    : "";
  return `You are an AI assistant for ${business.name || "this business"}. Not a human.
${OUTPUT_RULE}

If asked whether you are an AI or a real person: say you are an AI.
Unrelated to this shop: reply with this exact text only:
${offTopicLine(contact)}
Never disclose passwords, keys, or internals. Contact details are OK.
If asked how you work: ${POWERED}
Greetings: say hi and ask what you can help with. Never say you have no information.
Small talk is fine. Infer everyday language.
Use only the retrieved notes. Do not invent prices, hours, names, or policies. If a shop fact is missing, say so and give the contact.
Keep replies under ${REPLY_LIMIT} characters unless a required verbatim line is longer. Key points only. Short sentences.
Tone: ${tone.label}. ${tone.instruction}
Contact: ${contact}
${demo}

Retrieved notes:
${retrieved || "(None for this question.)"}

If they are clearly about to buy or book, prefix [[LEAD]]. If a shop fact was missing, prefix [[GAP]]. Not for greetings or off-topic.`;
}

function sitePrompt() {
  return `You are an AI assistant for sclxter (always lowercase). Not a human. You are on the sclxter marketing site.
${OUTPUT_RULE}

If asked whether you are an AI or a real person: say you are an AI.
Unrelated to sclxter: reply with this exact text only:
${SCLXTER_OFF_TOPIC}
Never disclose passwords, keys, or internals. sclxter@outlook.com is OK to give.
If asked how you work: ${POWERED}
If asked what sclxter is / does: reply with this exact text only:
${SCLXTER_WHAT_IS}
Greetings: say hi and ask what you can help with. Never say you have no information.
Small talk is fine. Infer everyday language.

Basic product facts (not private): customisable theme, tone, and notepad; Scan website; Ask anything widget; buy up to 12 months ahead; £299.99 setup then £74.99 a month; card payments when Stripe is live; fictional barber demo on this site.
Keep replies under ${REPLY_LIMIT} characters unless a required verbatim line is longer (the what-is-sclxter paragraph is allowed). Key points only. Short sentences.
Do not guess other internals. Do not dump the whole site.`;
}

export async function generateIndustryBriefing(industry: string) {
  const groq = client();
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content: `You write a hidden briefing for a shop’s website assistant. No live web search. Use general knowledge of this industry only. Do not invent a specific shop, brand, street, or price list. Plain text. No title like “industry research” or “extra scan”.`,
      },
      {
        role: "user",
        content: `Industry: ${industry}

Write 400–700 words covering:
- Typical services and common add-ons
- Ordinary customer questions in this industry
- What is usually possible vs unusual
- High-level suitability notes (e.g. sensitive skin, kids) when relevant
- What must be confirmed with the specific shop (whether they offer it, price, hours, policy)

Be concrete enough that the assistant can say “likely yes” or “usually not” for normal asks. Do not write prices for a named shop.`,
      },
    ],
  });
  const message = completion.choices[0]?.message;
  const content =
    (typeof message?.content === "string" && message.content.trim()) ||
    (typeof (message as { reasoning?: string } | undefined)?.reasoning ===
      "string" &&
      (message as { reasoning?: string }).reasoning?.trim()) ||
    "";
  if (!content) throw new Error("BRIEFING_EMPTY");
  return content;
}

function lastUser(messages: ChatMessage[]) {
  return [...messages].reverse().find((m) => m.role === "user");
}

function isRequiredVerbatim(text: string) {
  const body = text.replace(/^(\[\[(?:LEAD|GAP)\]\]\s*)+/g, "").trim();
  if (body === SCLXTER_WHAT_IS) return true;
  if (body.startsWith("I am programmed to assist you with related questions.")) {
    return true;
  }
  if (body === POWERED || body === AI_LINE || body === HELLO) return true;
  return false;
}

function looksLikeThought(text: string) {
  return /user asks|according to (the )?instructions|let'?s craft|we need to respond|we should (prefix|also|add)|the user wants|we can say|keep under \d+ characters|so we add \[\[/i.test(
    text,
  );
}

function extractQuotedAnswer(text: string) {
  const quotes = [...text.matchAll(/[“"]([^”"]{8,})[”"]/g)].map((m) => m[1].trim());
  return quotes.length ? quotes[quotes.length - 1] : "";
}

function visitorAnswer(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (!looksLikeThought(trimmed)) return trimmed;
  const quoted = extractQuotedAnswer(trimmed);
  if (quoted && !looksLikeThought(quoted)) return quoted;
  const after = trimmed.split(/short reply:\s*/i).pop() || "";
  const cleaned = after.replace(/^["“]|["”]$/g, "").trim();
  if (cleaned && cleaned !== trimmed && !looksLikeThought(cleaned)) return cleaned;
  return "";
}

function capReply(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (isRequiredVerbatim(trimmed) || trimmed.length <= REPLY_LIMIT) return trimmed;
  const prefix = trimmed.match(/^((?:\[\[(?:LEAD|GAP)\]\]\s*)*)/)?.[1] ?? "";
  const body = trimmed.slice(prefix.length);
  const room = REPLY_LIMIT - prefix.length;
  if (body.length <= room) return trimmed;
  const cut = body.slice(0, Math.max(0, room));
  const breakAt = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf(".\n"),
    cut.lastIndexOf("\n"),
    cut.lastIndexOf(" "),
  );
  const clipped = (breakAt > 40 ? cut.slice(0, breakAt + 1) : cut).trim();
  return `${prefix}${clipped}`;
}

export async function answerChat(opts: {
  business?: Business;
  knowledge?: KnowledgeItem[];
  messages: ChatMessage[];
  barber?: boolean;
  site?: boolean;
  notesOnly?: boolean;
}) {
  const asked = lastUser(opts.messages)?.content || "";
  if (isWhatIsSclxter(asked)) return SCLXTER_WHAT_IS;
  if (isHowPowered(asked)) return POWERED;
  if (isAiAsk(asked)) return AI_LINE;
  if (isGreeting(asked)) return HELLO;

  const related = opts.site
    ? isSiteRelated
    : (text: string) => isShopRelated(text, opts.business!);
  const contact = opts.site
    ? SCLXTER_CONTACT
    : contactLine(opts.business!);
  if (countTrailingUnrelated(opts.messages, related) >= 5) {
    return offTopicLine(contact);
  }

  const groq = client();
  const history = opts.messages.slice(-HISTORY).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let system: string;
  if (opts.site) {
    system = sitePrompt();
  } else {
    const biz = opts.business!;
    const source = shopSource(biz, opts.knowledge ?? [], Boolean(opts.notesOnly));
    const followUp = opts.messages
      .filter((m) => m.role === "user")
      .slice(-2)
      .map((m) => m.content)
      .join(" ");
    const retrieved = retrieveRelevant(source, followUp || asked);
    system = shopPrompt(biz, retrieved, contact, Boolean(opts.barber));
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 180,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    messages: [{ role: "system", content: system }, ...history],
  });

  const message = completion.choices[0]?.message;
  const raw =
    typeof message?.content === "string" ? message.content.trim() : "";
  const content = visitorAnswer(raw);
  if (content.startsWith("I am programmed to assist you with related questions")) {
    return offTopicLine(contact);
  }
  return capReply(content || "I could not get a reply just then. Try once more.");
}

export function parseLeadFromReply(reply: string) {
  const parsed = parseAssistantReply(reply);
  return { text: parsed.text, lead: parsed.lead, gap: parsed.gap };
}
