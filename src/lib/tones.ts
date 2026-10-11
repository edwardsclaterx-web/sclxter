export const TONES = [
  {
    id: "plain",
    label: "Plain and direct",
    instruction: "Short, literal sentences. No flourish.",
  },
  {
    id: "warm",
    label: "Warm and friendly",
    instruction: "Kind and approachable, still clear. No slang pile-up.",
  },
  {
    id: "formal",
    label: "Formal",
    instruction: "Polite, complete sentences. No jokes.",
  },
  {
    id: "concise",
    label: "Concise",
    instruction: "As few words as will answer. No preamble.",
  },
  {
    id: "professional",
    label: "Professional",
    instruction: "Businesslike and calm. No hype.",
  },
  {
    id: "casual",
    label: "Casual",
    instruction: "Relaxed everyday English. Stay useful.",
  },
  {
    id: "reassuring",
    label: "Calm and reassuring",
    instruction: "Steady and patient. Reduce worry without fluff.",
  },
  {
    id: "upbeat",
    label: "Upbeat",
    instruction: "Positive energy, not salesy, not emoji.",
  },
  {
    id: "expert",
    label: "Expert",
    instruction: "Informed and specific. Explain briefly when it helps.",
  },
  {
    id: "discreet",
    label: "Discreet",
    instruction: "Low-key and private. Do not overshare.",
  },
] as const;

export type ToneId = (typeof TONES)[number]["id"];

export function toneById(id: string | undefined) {
  return TONES.find((t) => t.id === id) ?? TONES[0];
}

export const NOTEPAD_NOTICE =
  "This text feeds the assistant. Visitors do not see it raw. The assistant does not search the live internet.";
