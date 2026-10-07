import { existsSync, readFileSync } from "node:fs";

const SECRET_FILE = "/cursor/stores/self/internal/.secrets.env";

function applyEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eq = trimmed.indexOf("=");
  if (eq < 1) return;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (key && value && !process.env[key]) {
    process.env[key] = value;
  }
}

export function loadSecrets() {
  if (existsSync(SECRET_FILE)) {
    const text = readFileSync(SECRET_FILE, "utf8");
    for (const line of text.split("\n")) applyEnvLine(line);
  }
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "dev-sclxter-session-not-for-production";
  }
}

export function groqKeyPresent() {
  loadSecrets();
  return Boolean(process.env.GROQ_API_KEY);
}
