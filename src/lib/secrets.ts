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
  if (!key || !leading) return;
  // Vercel / already-set runtime env wins. Never overwrite a live value with the file.
  const existing = process.env[key];
  if (typeof existing === "string" && existing.length > 0) return;
  process.env[key] = leading;
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

/** Runtime env (bracket access so Next does not inline at build). Never log the value. */
export function envSecret(name: string): string {
  loadSecrets();
  const raw = process.env[name];
  if (typeof raw !== "string" || !raw) return "";
  let v = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (v.length >= 2) {
    const a = v[0];
    const b = v[v.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      v = v.slice(1, -1);
    }
  }
  return v.replace(/[\r\n]+$/g, "");
}

export function groqKeyPresent() {
  return Boolean(envSecret("GROQ_API_KEY"));
}
