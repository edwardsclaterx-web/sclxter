export const INSTRUCTIONS_TITLE = "INSTRUCTIONS";
export const INSTRUCTIONS_KICKER = "please read before starting";

export const DEFAULT_INSTRUCTION_STEPS = [
  "Fill in all the information below, using your business's details.",
  "Select the tone for the AI Assistant, which you can customise for your store.",
  'Press "Scan website" then leave it to work — it reads public pages on the URL you saved. Add or correct anything it misses.',
  "Read through the notepad. The assistant answers from that text and the details you typed. It cannot search the live internet.",
  "Test your AI assistant. Ask a large variety of questions and look for any errors it makes. If it does so, you can type in the data box what it should remember.",
  "Change the colour settings of your assistant. Please note you cannot select the same primary colour and text colour.",
  "Finally, go to the bottom and setup the assistant. Follow the instructions based on how your website runs. If you have any problems contact sclxter@outlook.com or message an administrator in the Contact page (recommended).",
  "Once it's set up, view conversations from customers on your website. See what improvements can be made with the questions which can't be answered, and update your data.",
] as const;

export function normalizeInstructions(_steps?: unknown): string[] {
  return [...DEFAULT_INSTRUCTION_STEPS];
}
