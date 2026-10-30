import Groq from "groq-sdk";
import { CLARIFY } from "./chat-copy";
import { parseAssistantReply } from "./knowledge-gaps";
import { envSecret } from "./secrets";
import { toneById } from "./tones";
import type { Business, ChatMessage, KnowledgeItem } from "./types";

const MODEL = "openai/gpt-oss-20b";
const HISTORY = 16;
const RETRIEVE_CHARS = 3200;
const REPLY_LIMIT = 500;
export { CLARIFY } from "./chat-copy";

function client() {
  const key = envSecret("GROQ_API_KEY");
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
    .filter((w) => w.length > 2 || /^\d+$/.test(w));
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
const OUTPUT_RULE = `Output only the composed answer the visitor should read. Never think out loud. Never write planning, analysis, instruction recap, or phrases like User asks, According to instructions, We need to respond, We can say, or Let's craft.
Read the whole conversation. Keep context. Understand everyday language: slang, typos, shorthand, and what they are trying to do. Follow-ups continue the last question.
Answer the question they asked when you can. If the meaning is unclear, ask one short clarifying question instead of guessing. Do not invent facts.
Sound like a normal helpful assistant. Natural sentences. Do not steer them back to the business or product unless they asked about it.
Keep replies under ${REPLY_LIMIT} characters unless a required verbatim line is longer. Key points, still useful.
The greeting “${HELLO}” is only for hi, hello, or hey on their own. Real questions get a real answer, not a greeting.
Never say you are busy, to try again, or that something went wrong.`;

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
  return /^(hi|hello|hey)[\s!]*$/.test(norm(content));
}

function isGreetingOnlyReply(text: string) {
  return /^(hi|hello|hey)[\s!.,]*(what can i help( you)? with[?]?)?$/.test(
    norm(text),
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
  return /\b(hour|open|close|closed|price|cost|book|booking|appoint|cut|haircut|hair|recommend|suggest|style|trim|fade|beard|shave|service|menu|contact|phone|email|address|where|when|how much|walk in|walk-in|offer|do you|pound|£|article|articles|pace|cadence|run|running|post|posts|tool|tools|km|5k|watch|race|sick|injured)\b/.test(
    t,
  );
}

function looksLikeContinuation(content: string) {
  const t = norm(content);
  if (!t) return false;
  if (
    /^(i mean|i meant|yeah|yep|yah|nah|nope|yes|no|ok|okay|and|or|also|but|not|that|those|this|too|so|because|cos|cause|under|over|about|around|like|maybe)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (/^\d/.test(t)) return true;
  const words = t.split(" ").filter(Boolean);
  return words.length <= 2 && !/\b(weather|football|soccer|news|politics|homework|recipe)\b/.test(t);
}

function countTrailingUnrelated(
  messages: ChatMessage[],
  related: (text: string) => boolean,
) {
  let n = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (looksLikeContinuation(m.content)) continue;
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

function closeToken(a: string, b: string) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (Math.abs(a.length - b.length) > 2) return false;
  const n = Math.min(4, a.length, b.length);
  return a.slice(0, n) === b.slice(0, n);
}

function scoreChunk(chunk: string, queryTokens: string[]) {
  const hay = norm(chunk);
  const words = hay.split(" ").filter(Boolean);
  let score = 0;
  for (const tok of queryTokens) {
    if (hay.includes(tok)) score += tok.length > 5 ? 2 : 1;
    else {
      for (const word of words) {
        if (word.length > 2 && (tok.includes(word) || word.includes(tok) || closeToken(tok, word))) {
          score += 1;
          break;
        }
      }
    }
  }
  return score;
}

function factChunks(source: string) {
  return chunkText(source).filter((c) =>
    /source:\s*https?:\/\/|https?:\/\/|\/[a-z0-9-]+\/[a-z0-9-]+|£|\$\d|price|hour|open|closed?|cut|service|fade|beard|monday|tuesday|wednesday|thursday|friday|saturday|sunday|pace|cadence|km\b|5k/i.test(
      c,
    ),
  );
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

function retrieveForQuestion(
  source: string,
  query: string,
  recentUser: string[],
) {
  const combined = [...recentUser.slice(-4), query].join(" ");
  const ranked = retrieveRelevant(source, combined);
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const c of [...factChunks(source), ...chunkText(ranked)]) {
    if (!c || seen.has(c)) continue;
    seen.add(c);
    parts.push(c);
  }
  let got = parts.join("\n\n");
  if (got.length < 80) got = source;
  return got.slice(0, RETRIEVE_CHARS);
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
Use this exact unrelated line only when they are clearly asking about something else entirely (news, sport, politics, other businesses, schoolwork). Everyday chat about this shop, messy wording, slang, and follow-ups are related. Do not use it just because the wording is odd.
${offTopicLine(contact)}
Never disclose passwords, keys, or internals. Contact details are OK.
If asked how you work: ${POWERED}
Use only the retrieved notes. Do not use general industry knowledge. Do not write generic genre advice.
Do not invent prices, hours, names, policies, article titles, paths, or URLs.
Only mention a URL or page path if it appears verbatim in the notes. If it is not in the notes, do not invent one.
If the notes have the answer, answer with those specific facts (titles, quotes, paths that are written there).
If the notes do not have the fact, say you do not have that on this site. Do not fill the gap with typical running, barber, or other industry waffle.
If you cannot tell what they want, ask one clarifying question. Do not guess.
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
Use this exact unrelated line only when they are clearly asking about something else entirely, not when the wording is messy or they are following up:
${SCLXTER_OFF_TOPIC}
Never disclose passwords, keys, or internals. sclxter@outlook.com is OK to give.
If asked how you work: ${POWERED}
If asked what sclxter is / does: reply with this exact text only:
${SCLXTER_WHAT_IS}

Basic product facts (not private): customisable theme, tone, and notepad; Scan website; Ask anything widget; buy up to 12 months ahead; £299.99 setup then £74.99 a month; pay on Billing; fictional barber demo on this site.
Do not guess other internals. Do not dump the whole site. If you cannot tell what they want, ask one clarifying question.`;
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
  if (body === POWERED || body === AI_LINE || body === HELLO || body === CLARIFY) return true;
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

function notesAllowUrl(notes: string, value: string) {
  const hay = notes.toLowerCase();
  const raw = value.replace(/[.,;:]+$/, "");
  if (hay.includes(raw.toLowerCase())) return true;
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    if (path.length > 1 && hay.includes(path)) return true;
    if (hay.includes(u.href.replace(/\/+$/, "").toLowerCase())) return true;
  } catch {
    const path = raw.replace(/\/+$/, "").toLowerCase();
    if (path.length > 2 && hay.includes(path)) return true;
  }
  return false;
}

function stripUnknownLinks(text: string, notes: string) {
  if (!text) return text;
  let out = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, (full, label, href) => {
    return notesAllowUrl(notes, href) ? full : String(label);
  });
  out = out.replace(/https?:\/\/[^\s)\]>'"]+/gi, (url) => {
    const clean = url.replace(/[.,;:]+$/, "");
    return notesAllowUrl(notes, clean) ? url : "";
  });
  out = out.replace(/\/(?:running|blog|articles?|posts?|journal|news)\/[a-z0-9/-]+/gi, (path) => {
    return notesAllowUrl(notes, path) ? path : "";
  });
  return out.replace(/[ \t]{2,}/g, " ").replace(/ \./g, ".").trim();
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
  let retrievedNotes = "";
  if (opts.site) {
    system = sitePrompt();
  } else {
    const biz = opts.business!;
    const source = shopSource(biz, opts.knowledge ?? [], Boolean(opts.notesOnly));
    const recentUser = opts.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .slice(-4);
    retrievedNotes = retrieveForQuestion(source, asked, recentUser);
    system = shopPrompt(biz, retrievedNotes, contact, Boolean(opts.barber));
  }

  async function complete() {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: opts.site ? 0.4 : 0.2,
      max_tokens: 220,
      reasoning_effort: "low",
      reasoning_format: "hidden",
      messages: [{ role: "system", content: system }, ...history],
    });
    const message = completion.choices[0]?.message;
    const raw =
      typeof message?.content === "string" ? message.content.trim() : "";
    return visitorAnswer(raw);
  }

  let content = await complete();
  if (!content || (!isGreeting(asked) && isGreetingOnlyReply(content))) {
    content = await complete();
  }
  if (content.startsWith("I am programmed to assist you with related questions")) {
    return offTopicLine(contact);
  }
  if (!isGreeting(asked) && isGreetingOnlyReply(content)) {
    return CLARIFY;
  }
  if (!opts.site) {
    content = stripUnknownLinks(content, retrievedNotes);
  }
  return capReply(content || CLARIFY);
}

export function parseLeadFromReply(reply: string) {
  const parsed = parseAssistantReply(reply);
  return { text: parsed.text, lead: parsed.lead, gap: parsed.gap };
}
