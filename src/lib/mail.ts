import "server-only";

import { envSecret } from "./secrets";

export function mailConfigured() {
  return Boolean(
    envSecret("RESEND_API_KEY") ||
      envSecret("SMTP_HOST") ||
      envSecret("SMTP_URL"),
  );
}

function fromAddress() {
  return (
    envSecret("RESEND_FROM") ||
    envSecret("MAIL_FROM") ||
    "sclxter <sclxter@outlook.com>"
  );
}

async function sendResend(to: string, subject: string, text: string) {
  const key = envSecret("RESEND_API_KEY");
  if (!key) return false;
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
  return res.ok;
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

/** Send mail. If no mail key, logs the body on the server only (dev). Never returns the body. */
export async function sendProductMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean; mocked: boolean }> {
  if (envSecret("RESEND_API_KEY")) {
    const sent = await sendResend(opts.to, opts.subject, opts.text);
    return { sent, mocked: false };
  }
  if (envSecret("SMTP_HOST") || envSecret("SMTP_URL")) {
    const sent = await sendSmtp(opts.to, opts.subject, opts.text);
    return { sent, mocked: false };
  }
  console.info(
    `[sclxter mail] no mail key; would send to ${opts.to}: ${opts.text}`,
  );
  return { sent: true, mocked: true };
}
