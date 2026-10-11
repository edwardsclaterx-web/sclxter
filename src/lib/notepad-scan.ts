export function applyScanToNotepad(
  notepad: string,
  lastScanText: string | undefined,
  nextBlock: string,
): string {
  const pad = notepad || "";
  const last = lastScanText || "";
  if (last && pad.includes(last)) {
    return pad.replace(last, nextBlock);
  }
  const trimmed = pad.trim();
  return trimmed ? `${trimmed}\n\n${nextBlock}` : nextBlock;
}
