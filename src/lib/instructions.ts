export const INSTRUCTIONS_TITLE = "INSTRUCTIONS";
export const INSTRUCTIONS_KICKER = "please read before starting";

export const DEFAULT_INSTRUCTION_STEPS = [
  "Fill in all the information below, using your business's details.",
  "Select the tone for the AI Assistant, which you can customise for your store.",
  'Press "Scan website" then leave it to work (should take a few second but can vary based on website size) it reads text displayed on your website (make sure you add it). Add or correct anything it misses.',
  "Read through the notepad. The assistant answers from the text within that notepad, so make sure all information is available there.",
  "Test your AI assistant in the test box. Ask a large variety of questions and look for any errors it makes. If it does so, you can type in the data box what it should remember.",
  "Change the theme colours of your assistant. Please note you cannot select the same primary colour and text colour.",
  "Finally, go to the bottom and setup the assistant. Follow the instructions based on how your website runs. If you have any problems contact sclxter@outlook.com or message an administrator in the Contact page (recommended).",
  "Once it's set up, test it on your website and add anything the assistant misses into the notepad.",
] as const;

export function normalizeInstructions(_steps?: unknown): string[] {
  return [...DEFAULT_INSTRUCTION_STEPS];
}
