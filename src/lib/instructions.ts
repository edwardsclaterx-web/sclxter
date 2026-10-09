export const INSTRUCTIONS_TITLE = "INSTRUCTIONS";
export const INSTRUCTIONS_KICKER = "please read before starting";

export const DEFAULT_INSTRUCTION_STEPS = [
  "Fill in all the information below, using your business's details.",
  "Select the tone for the AI Assistant, which you can choose for your store",
  'Enter your website name once more for confirmation, then press "Scan website" then leave the AI to do it\'s thing for a few minutes, and it will come back with all the data avaiable on your website.',
  "Read through the data collected, add things, and also change anything which may be misleading. Please note the AI is an intelligent software which means it can research information online, if not available on your website, but related to your business. (You can leave it without this extra information, as it will search for it online when a customer requests.",
  "Test your AI assistant. Ask a large variety of questions and look for any errors it makes. If it does so, you can type in the data box what it should remember.",
  "Once it's setup, view conversations from customers on your website. See what improvements can be made, and update your data.",
] as const;

export function normalizeInstructions(steps: unknown): string[] {
  if (
    Array.isArray(steps) &&
    steps.length === 6 &&
    steps.every((s) => typeof s === "string" && s.trim())
  ) {
    return steps.map((s) => s);
  }
  return [...DEFAULT_INSTRUCTION_STEPS];
}
