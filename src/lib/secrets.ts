import { existsSync, readFileSync } from "node:fs";

const SECRET_FILE = "/cursor/stores/self/internal/.secrets.env";

function applyEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eq = trimmed.indexOf("=");
  if (eq < 1) return;
  const key = trimmed.slice(0, eq).trim();
  // Keep the rest of the line as the value. Do not treat # [ ] ' - as comments
  // or strip them. Do not unquote — secrets must not be stored with wrapping quotes.
  const value = trimmed.slice(eq + 1).trimEnd();
  const leading = value.trimStart();
  if (key && leading) {
    process.env[key] = leading;
  }
}

export function loadSecrets() {
  if (existsSync(SECRET_FILE)) {
    const text = readFileSync(SECRET_FILE, "utf8");
    for (const line of text.split(/\r?\n/)) applyEnvLine(line);
  }
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "dev-sclxter-session-not-for-production";
  }
}

export function groqKeyPresent() {
  loadSecrets();
  return Boolean(process.env.GROQ_API_KEY);
}
