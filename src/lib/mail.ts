import "server-only";

import { envSecret } from "./secrets";

export const MAIL_FAIL =
  "We could not email the code. Add RESEND_API_KEY on Vercel, then send a new code.";

const DEFAULT_FROM = "sclxter <onboarding@resend.dev>";

export function mailConfigured() {
  return Boolean(
    envSecret("RESEND_API_KEY") ||
      envSecret("SMTP_HOST") ||
      envSecret("SMTP_URL"),
  );
}

function fromAddress() {
  const custom =
    envSecret("RESEND_FROM").trim() || envSecret("MAIL_FROM").trim();
  if (!custom) return DEFAULT_FROM;
  return custom;
}

function redact(text: string) {
  return text
    .replace(/re_[A-Za-z0-9]+/g, "re_…")
    .replace(/Bearer\s+\S+/gi, "Bearer …");
}

export function classifyResendError(status: number, body: string) {
  const t = body.toLowerCase();
  if (status === 401 || t.includes("invalid api key") || t.includes("api key is invalid")) {
    return "invalid key";
  }
  if (
    t.includes("only send testing emails") ||
    t.includes("own email address") ||
    t.includes("you can only send")
  ) {
    return "sending only allowed to the account owner email";
  }
  if (
    t.includes("not verified") ||
    t.includes("domain is not") ||
    t.includes("verify your domain") ||
    t.includes("add and verify")
  ) {
    return "domain not verified";
  }
  if (status === 403) return "domain not verified";
  if (status === 429) return "rate limited";
  if (status >= 500) return "Resend was unavailable";
  return "send failed";
}

function uiError(category: string) {
  return `We could not email the code. Resend: ${category}.`;
}

async function sendResend(to: string, subject: string, text: string) {
  const key = envSecret("RESEND_API_KEY").trim();
  if (!key) {
    return {
      sent: false,
      category: "key not readable at runtime",
    };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      text,
    }),
  });
  const raw = await res.text().catch(() => "");
  if (res.ok) return { sent: true, category: null as string | null };
  const category = classifyResendError(res.status, raw);
  console.info(`[sclxter mail] resend ${res.status}: ${category}`);
  if (raw) console.info(`[sclxter mail] resend detail: ${redact(raw).slice(0, 300)}`);
  return { sent: false, category };
}

async function sendSmtp(to: string, subject: string, text: string) {
  const url = envSecret("SMTP_URL");
  const host = envSecret("SMTP_HOST");
  if (!url && !host) return false;
  const nodemailer = await import("nodemailer");
  const transporter = url
    ? nodemailer.createTransport(url)
    : nodemailer.createTransport({
        host,
        port: Number(envSecret("SMTP_PORT") || "587"),
        secure: envSecret("SMTP_PORT") === "465",
        auth:
          envSecret("SMTP_USER") && envSecret("SMTP_PASS")
            ? {
                user: envSecret("SMTP_USER"),
                pass: envSecret("SMTP_PASS"),
              }
            : undefined,
      });
  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
  });
  return true;
}

/** Send mail. Never logs the body, codes, or keys. */
export async function sendProductMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean; mailError: string | null }> {
  try {
    if (envSecret("RESEND_API_KEY").trim()) {
      const out = await sendResend(opts.to, opts.subject, opts.text);
      return {
        sent: out.sent,
        mailError: out.sent ? null : uiError(out.category || "send failed"),
      };
    }
    if (envSecret("SMTP_HOST") || envSecret("SMTP_URL")) {
      const sent = await sendSmtp(opts.to, opts.subject, opts.text);
      return {
        sent,
        mailError: sent ? null : MAIL_FAIL,
      };
    }
  } catch {
    return {
      sent: false,
      mailError: uiError("send failed"),
    };
  }
  console.info("[sclxter mail] resend: key not readable at runtime");
  return {
    sent: false,
    mailError: uiError("key not readable at runtime"),
  };
}
