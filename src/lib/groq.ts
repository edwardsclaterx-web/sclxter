import Groq from "groq-sdk";
import { CLARIFY } from "./chat-copy";
import { parseAssistantReply } from "./knowledge-gaps";
import { envSecret } from "./secrets";
import { toneById } from "./tones";
import type { Business, ChatMessage, KnowledgeItem } from "./types";

const MODEL = "openai/gpt-oss-20b";
const HISTORY = 16;
const RETRIEVE_CHARS = 3200;
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
  return bits.length ? bits.join(" · ") : "the contact details on this website";
}

function refuseLine(subject: string, contact: string) {
  const name = (subject || "this business").trim() || "this business";
  return `I can only help with questions about ${name}. Contact ${contact} for further enquiries.`;
}

function offTopicLine(subject: string, contact: string) {
  return refuseLine(subject, contact);
}

export const SCLXTER_SITE_ID = "sclxter";

const SCLXTER_WHAT_IS =
  "sclxter is an AI assistant, which can be purchased and then added onto your website. It automatically scans the data already presented on your website, and then prepares for questions. It answers customers enquiries, and provides a better overall experience.";

const SCLXTER_CONTACT = "sclxter@outlook.com";
const POWERED = "I am powered by sclxter.com";
const AI_LINE = "Yes. I am an AI, not a real person.";
const DEMO_REAL_LINE = "Yes. This is a demo page for sclxter.com.";
const HELLO = "Hi, what can I help you with?";
const OUTPUT_RULE = `Output only the composed answer the visitor should read. Never think out loud. Never write planning, analysis, instruction recap, or phrases like User asks, According to instructions, We need to respond, We can say, or Let's craft.
Read the whole conversation. Keep context. Understand everyday language: slang, typos, shorthand, and what they are trying to do. Follow-ups continue the last on-topic question.
Answer about this website or this business. Product, pricing, demo, and whether you are an AI are on-topic when they apply.
Refuse only clearly unrelated topics (football, weather, coding, camera lenses, homework, celebrities, news, other sports). Then use the required unrelated reply — that exact text only. Do not add extra facts.
Follow-ups such as “what do you mean”, “why”, “tell me more”, yes/no, and short clarifiers continue the last on-topic turn. Answer them using that context. Do not refuse. Do not ask what they meant.
If a first on-topic question is unclear, you may ask one short clarifying question once. Never ask for clarification again. Prefer a best-effort answer from conversation context. Never say “Could you say what you meant?” more than once.
Sound like a normal helpful assistant. Natural sentences.
Be concise. Aim for a short answer. Go longer when the question genuinely needs it. Never pad, ramble, or cut the answer short.
The greeting “${HELLO}” is only for hi, hello, or hey on their own. Real on-topic questions get a real answer, not a greeting.
Never say you are busy, to try again, or that something went wrong.`;

function isWhatIsSclxter(content: string) {
  const t = norm(content);
  return /\b(what is sclxter|whats sclxter|what sclxter is|what does sclxter do|whats sclxter do|tell me about sclxter|explain sclxter|describe sclxter)\b/.test(
    t,
  );
}

function isSclxterAsk(content: string) {
  return /\bsclxter\b/.test(norm(content));
}

function isDemoOrRealShopAsk(content: string) {
  const t = norm(content);
  if (/\bsclxter\b/.test(t) && /\bdemo\b/.test(t)) return true;
  if (/\b(demo page|a demo|this (page|site|website) (a )?demo)\b/.test(t)) {
    return true;
  }
  if (
    /\bnorthgate\b/.test(t) &&
    /\b(real|fake|fictional|demo|actual|genuine|made up)\b/.test(t)
  ) {
    return true;
  }
  if (
    /\b(is|are) (this|the) (shop|business|barber|page|site|website)\b/.test(t) &&
    /\b(real|fake|fictional|demo|actual|genuine|made up)\b/.test(t)
  ) {
    return true;
  }
  return false;
}

function isMakerAsk(content: string) {
  const t = norm(content);
  if (isHowPowered(content)) return true;
  if (
    /\bwho (made|built|created|runs|owns|powers|developed|provides)\b/.test(t) &&
    /\b(this|the|you|it|assistant|ai|widget|chat|bot)\b/.test(t)
  ) {
    return true;
  }
  return false;
}

function isAiAsk(content: string) {
  const t = norm(content);
  const machine =
    /\b(ai|an ai|a i|artificial|bot|robot|human|real person|a person|person|staff|a human)\b/;
  if (/\b(are you|r u|ru)\b/.test(t) && (machine.test(t) || /\breal\b/.test(t))) {
    return true;
  }
  if (/\b(is this|is that|is it)\b/.test(t) && machine.test(t)) return true;
  return false;
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

function isSmallTalk(content: string) {
  const t = norm(content);
  if (isGreeting(content)) return true;
  return /^(hi|hello|hey|thanks|thank you|cheers|ta|good (morning|afternoon|evening)|how are you|hows it going|how are you doing|whats up)[\s!]*$/.test(
    t,
  );
}

function isMetaAsk(content: string) {
  return (
    isAiAsk(content) ||
    isHowPowered(content) ||
    isWhatIsSclxter(content) ||
    isMakerAsk(content) ||
    isSclxterAsk(content) ||
    isDemoOrRealShopAsk(content)
  );
}

function shopSclxterLine(business?: Business) {
  const name = (business?.name || "").trim();
  const help = name
    ? `How can I help with ${name}?`
    : "How can I help with this business?";
  return `Yes, I'm an AI assistant powered by sclxter.com. ${help}`;
}

function isAboutThePlace(content: string, business?: Business, site?: boolean) {
  const t = norm(content);
  if (isSmallTalk(t) || isMetaAsk(t)) {
    return true;
  }
  if (site) return isSiteRelated(content);
  const name = norm(business?.name || "");
  if (name && t.includes(name)) return true;
  const first = name.split(" ")[0];
  if (first && first.length > 3 && t.includes(first)) return true;
  return /\b(service|services|price|prices|cost|hour|hours|open|opening|close|closed|book|booking|appoint|appointment|location|address|product|products|offer|package|packages|website|site|contact|phone|email|menu|how much|opening times)\b/.test(
    t,
  );
}

function notesHaveRelevantMatch(
  source: string,
  query: string,
  recentUser: string[],
) {
  const combined = [...recentUser.slice(-4), query].join(" ");
  const q = tokens(combined);
  if (!source.trim() || !q.length) return false;
  return chunkText(source).some((c) => scoreChunk(c, q) > 0);
}

function isGreetingOnlyReply(text: string) {
  return /^(hi|hello|hey)[\s!.,]*(what can i help( you)? with[?]?)?$/.test(
    norm(text),
  );
}

function isSiteRelated(content: string) {
  const t = norm(content);
  if (isGreeting(t) || isMetaAsk(t)) {
    return true;
  }
  return /\b(sclxter|price|cost|buy|pay|paid|month|theme|tone|notepad|scan|widget|demo|faq|custom|customise|customize|stripe|setup|assistant|dashboard|embed|colour|color|billing|subscription)\b/.test(
    t,
  );
}

function isShopRelated(content: string, business: Business) {
  const t = norm(content);
  if (isGreeting(t) || isMetaAsk(t)) {
    return true;
  }
  const name = norm(business.name || "");
  const industry = norm(business.industry || "");
  if (name && t.includes(name)) return true;
  if (industry && t.includes(industry)) return true;
  return /\b(hour|open|close|closed|price|cost|book|booking|appoint|cut|haircut|hair|recommend|suggest|style|trim|fade|beard|shave|service|menu|contact|phone|email|address|where|when|how much|walk in|walk-in|offer|do you|pound|£|article|articles|pace|cadence|run|running|post|posts|tool|tools|km|5k|10k|parkrun|marathon|training|interval|pb|watch|race|sick|injured|koffee|coffee|barista|tonic|pomade|morgans|recruit|billericay|emporium|kevin|walk-?ins?)\b/.test(
    t,
  );
}

function isClearlyOffTopic(content: string) {
  const t = norm(content);
  if (!t || isSmallTalk(t) || isMetaAsk(t)) return false;
  return /\b(football|soccer|premier league|world cup|weather|forecast|temperature|climate|homework|essay|coursework|coding|javascript|python|typescript|write (some |me )?code|camera|lenses|lens|photography|celebrity|celebrities|politics|election|recipe|recipes|stock market|bitcoin|crypto)\b/.test(
    t,
  );
}

function looksLikeContinuation(content: string) {
  const t = norm(content);
  if (!t) return false;
  if (isClearlyOffTopic(t)) return false;
  if (
    /^(i mean|i meant|yeah|yep|yah|nah|nope|yes|no|ok|okay|and|or|also|but|not|that|those|this|too|so|because|cos|cause|under|over|about|around|like|maybe|why|how so|go on|more|again|sorry|huh|eh)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /\b(what do you mean|what does (that|this|it) mean|what did you mean|can you (explain|clarify)|could you (explain|clarify)|say (that|it) again|tell me more|explain (that|this|it)|for example|like what)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (/^\d/.test(t)) return true;
  const words = t.split(" ").filter(Boolean);
  return words.length <= 4;
}

function isClarifyLine(text: string) {
  const t = norm(text);
  return t === norm(CLARIFY) || /\bcould you say what you meant\b/.test(t);
}

function alreadyAskedClarify(messages: ChatMessage[]) {
  return messages.some((m) => m.role === "assistant" && isClarifyLine(m.content));
}

function countTrailingUnrelated(messages: ChatMessage[]) {
  let n = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (looksLikeContinuation(m.content)) continue;
    if (!isClearlyOffTopic(m.content)) break;
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
    ? `This shop is a fictional demo for sclxter.com.
Questions about sclxter, this demo, whether Northgate is real, and whether you are an AI are on-topic.
If asked whether Northgate or this shop is real, or whether this page is a demo: "${DEMO_REAL_LINE}"
If asked what sclxter is: reply with this exact text only:
${SCLXTER_WHAT_IS}
Basic sclxter product facts are OK. Do not dump prices unless they asked.`
    : `Stay on this business. Short clarifiers are on-topic.
Mention sclxter.com only if they ask who made you or what powers you. Then reply with this exact text only:
${shopSclxterLine(business)}
No sales pitch, pricing, or extra product detail. Then you may help with this business.`;
  const subject = business.name?.trim() || "this business";
  const industry = (business.industry || "").trim() || "this trade";
  const briefing = (business.industryBriefing || "").trim();
  return `You are an AI assistant for ${subject} (${industry}). Not a human.
${OUTPUT_RULE}

If asked whether you are an AI or a real person: say you are an AI.
Stay in this business’s domain (${industry} / ${subject}). Related questions in that domain are on-topic even if the exact fact is not on their pages.
Questions about whether you are an AI are allowed. Mention sclxter.com only if they asked who made you.
No general knowledge for clearly unrelated topics (football, weather, coding, camera lenses), even if you know it, even briefly.
If they ask about those unrelated topics, reply with this exact text only:
${refuseLine(subject, contact)}
Follow-ups and short clarifiers that continue the last on-topic question are still on-topic. Answer them using that context. Do not refuse them. Do not ask what they meant.
Never disclose passwords, keys, or internals. Contact details are OK.
If asked how you work: ${POWERED}
When the retrieved notes have the shop fact, ground the answer in those notes. Do not invent prices, hours, names, policies, article titles, paths, or URLs.
Only mention a URL or page path if it appears verbatim in the notes.
If the notes do not have the exact fact but the question is still about ${industry} or ${subject}, give a short useful answer (a few sentences). Say it is not from their pages. Do not dump generic web trivia or a long essay. Prefix [[GAP]].
If they already asked a follow-up, give a best-effort answer from the notes, the domain, and the prior turn. Ask at most one clarifying question in the whole conversation.
Tone: ${tone.label}. ${tone.instruction}
Contact: ${contact}
${demo}

Retrieved notes (from their pages):
${retrieved || "(None for this question.)"}
${briefing ? `\nIndustry briefing (not from their pages; use only for related ${industry} questions when notes lack the fact):\n${briefing.slice(0, 1800)}` : ""}

If they are clearly about to buy or book, prefix [[LEAD]]. If a shop fact was missing and you used domain knowledge, prefix [[GAP]]. Not for greetings or off-topic.`;
}

function sitePrompt() {
  const refuse = refuseLine("sclxter", SCLXTER_CONTACT);
  return `You are an AI assistant for sclxter (always lowercase). Not a human. You are on the sclxter marketing site.
${OUTPUT_RULE}

If asked whether you are an AI or a real person: say you are an AI.
Answer about sclxter: the product, pricing, demo, setup, and whether you are an AI. No general knowledge for clearly unrelated topics, even briefly.
If they ask about football, weather, coding, camera lenses, homework, celebrities, news, or other sports, reply with this exact text only:
${refuse}
Follow-ups and short clarifiers that continue the last on-topic question are still on-topic. Answer them using that context. Do not refuse them. Do not ask what they meant.
Never disclose passwords, keys, or internals. sclxter@outlook.com is OK to give.
If asked how you work: ${POWERED}
If asked what sclxter is / does: reply with this exact text only:
${SCLXTER_WHAT_IS}

Basic product facts (not private): customisable theme, tone, and notepad; Scan website; Ask anything widget; buy up to 12 months ahead; £100.00 setup then £74.99 a month; pay on Billing; fictional barber demo on this site.
Do not guess other internals. Do not dump the whole site. Ask at most one clarifying question in the whole conversation; then give a best-effort answer.`;
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
  if (body.startsWith("I can only help with questions about ")) {
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

export async function answerChat(opts: {
  business?: Business;
  knowledge?: KnowledgeItem[];
  messages: ChatMessage[];
  barber?: boolean;
  site?: boolean;
  notesOnly?: boolean;
}) {
  const asked = lastUser(opts.messages)?.content || "";
  if (isGreeting(asked)) return HELLO;
  if (opts.site) {
    if (isWhatIsSclxter(asked)) return SCLXTER_WHAT_IS;
    if (isHowPowered(asked) || isMakerAsk(asked)) return POWERED;
    if (isAiAsk(asked)) return AI_LINE;
  } else if (opts.barber) {
    if (isWhatIsSclxter(asked)) return SCLXTER_WHAT_IS;
    if (isDemoOrRealShopAsk(asked)) return DEMO_REAL_LINE;
    if (isAiAsk(asked)) return AI_LINE;
    if (isHowPowered(asked) || isMakerAsk(asked)) return POWERED;
  } else if (
    isWhatIsSclxter(asked) ||
    isAiAsk(asked) ||
    isHowPowered(asked) ||
    isMakerAsk(asked) ||
    isSclxterAsk(asked)
  ) {
    return shopSclxterLine(opts.business);
  }

  const related = opts.site
    ? isSiteRelated
    : (text: string) => isShopRelated(text, opts.business!);
  const contact = opts.site
    ? SCLXTER_CONTACT
    : contactLine(opts.business!);
  const subject = opts.site
    ? "sclxter"
    : opts.business?.name?.trim() || "this business";
  const refuse = refuseLine(subject, contact);
  if (countTrailingUnrelated(opts.messages) >= 5) {
    return refuse;
  }

  const recentUser = opts.messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(-4);
  const prior = recentUser.slice(0, -1);
  const lastPrior = prior[prior.length - 1] || "";
  const lastTurnOnTopic = Boolean(
    lastPrior &&
      !isClearlyOffTopic(lastPrior) &&
      (related(lastPrior) ||
        isAboutThePlace(lastPrior, opts.business, opts.site) ||
        isSmallTalk(lastPrior) ||
        isMetaAsk(lastPrior)),
  );
  const followUp =
    !isClearlyOffTopic(asked) &&
    (lastTurnOnTopic ||
      (looksLikeContinuation(asked) &&
        prior.some(
          (t) =>
            !isClearlyOffTopic(t) &&
            (related(t) || isAboutThePlace(t, opts.business, opts.site)),
        )));
  const onThisBusiness = Boolean(
    related(asked) || isAboutThePlace(asked, opts.business, opts.site),
  );
  const usedClarify = alreadyAskedClarify(opts.messages);
  const bestEffort = opts.site
    ? "I can help with sclxter — the product, pricing, the demo, setup, or whether I am an AI."
    : `I can help with ${subject}. Ask about hours, prices, or what they offer.`;

  let retrievedNotes = "";
  let source = "";
  if (!opts.site && opts.business) {
    source = shopSource(
      opts.business,
      opts.knowledge ?? [],
      Boolean(opts.notesOnly),
    );
    retrievedNotes = retrieveForQuestion(source, asked, recentUser);
  }
  const notesHit = opts.site
    ? false
    : notesHaveRelevantMatch(source, asked, recentUser);
  if (
    isClearlyOffTopic(asked) &&
    !onThisBusiness &&
    !notesHit &&
    !followUp
  ) {
    return refuse;
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
    system = shopPrompt(
      opts.business!,
      retrievedNotes,
      contact,
      Boolean(opts.barber),
    );
  }

  const nudge =
    followUp || usedClarify
      ? "The last turn was on-topic. Answer this follow-up using that context. Do not ask what they meant. Do not say Could you say what you meant."
      : "";

  async function complete(extra = "") {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: opts.site ? 0.4 : 0.2,
      max_tokens: 2048,
      reasoning_effort: "low",
      reasoning_format: "hidden",
      messages: [
        { role: "system", content: extra ? `${system}\n${extra}` : system },
        ...history,
      ],
    });
    const message = completion.choices[0]?.message;
    const raw =
      typeof message?.content === "string" ? message.content.trim() : "";
    return visitorAnswer(raw);
  }

  let content = await complete(nudge);
  if (
    !content ||
    isClarifyLine(content) ||
    (!isGreeting(asked) && isGreetingOnlyReply(content))
  ) {
    content = await complete(
      "Give a best-effort answer from the conversation. Never ask for clarification.",
    );
  }
  if (
    !opts.site &&
    !isClearlyOffTopic(asked) &&
    (onThisBusiness || followUp) &&
    /do not have that on this site|not (listed|on) (this|their) (site|pages)|haven'?t got that on/i.test(
      content,
    )
  ) {
    content = await complete(
      `The question is in this business’s domain. Give a short useful answer. Say it is not from their pages. Prefix [[GAP]]. Do not say you do not have that on this site as the whole reply.`,
    );
  }
  if (
    content.startsWith("I am programmed to assist you with related questions") ||
    content.startsWith("I can only help with questions about ")
  ) {
    if (isClearlyOffTopic(asked) && !followUp && !onThisBusiness) {
      return refuse;
    }
    content = "";
  }
  if (isClarifyLine(content) || (!isGreeting(asked) && isGreetingOnlyReply(content))) {
    content = "";
  }
  if (!opts.site) {
    content = stripUnknownLinks(content, retrievedNotes);
  }
  if (!content) {
    if (followUp || usedClarify || lastTurnOnTopic) return bestEffort;
    return CLARIFY;
  }
  return content.trim();
}

export function parseLeadFromReply(reply: string) {
  const parsed = parseAssistantReply(reply);
  return { text: parsed.text, lead: parsed.lead, gap: parsed.gap };
}
