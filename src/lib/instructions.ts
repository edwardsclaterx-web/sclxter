export const INSTRUCTIONS_TITLE = "INSTRUCTIONS";
export const INSTRUCTIONS_KICKER = "please read before starting";

export const DEFAULT_INSTRUCTION_STEPS = [
  "Fill in all the information below, using your business's details.",
  "Select the tone for the AI Assistant, which you can customise for your store.",
  'Press "Scan website" then leave the AI to do it\'s thing - it will come back with all the data available on your website.',
  "Read through the data collected, add things, and also change anything which may be misleading. Please note the AI is an intelligent software which means it can research information online, if not available on your website, but related to your business. (You can leave it without this extra information, as it will search for it online when a customer requests).",
  "Test your AI assistant. Ask a large variety of questions and look for any errors it makes. If it does so, you can type in the data box what it should remember.",
  "Change the colour settings of your assistant. Please note you cannot select the same primary colour and text colour.",
  "Finally, go to the bottom and setup the assistant. Follow the instructions based on how your website runs. If you have any problems contact sclxter@outlook.com or message an administrator in the Contact page (recommended).",
  "Once it's set up, view conversations from customers on your website. See what improvements can be made with the questions which can't be answered, and update your data.",
] as const;

export function normalizeInstructions(_steps?: unknown): string[] {
  return [...DEFAULT_INSTRUCTION_STEPS];
}
