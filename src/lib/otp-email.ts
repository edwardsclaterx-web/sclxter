export const OTP_SUBJECT = "Your sclxter sign-in code";
export const OTP_REPLY_TO = "sclxter@outlook.com";
export const OTP_FROM = "sclxter <noreply@sclxter.com>";

export function otpEmailText(code: string) {
  return [
    `Your sclxter sign-in code is ${code}.`,
    "",
    "It expires in 8 minutes and can be used once.",
    "If you did not try to sign in, ignore this email.",
  ].join("\n");
}

export function otpEmailHtml(code: string) {
  const safe = code.replace(/[^\d]/g, "").slice(0, 6);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Your sclxter sign-in code</title></head>
<body style="margin:0;padding:24px;background:#050505;color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;">
  <p style="margin:0 0 16px;">Your sclxter sign-in code is</p>
  <p style="margin:0 0 16px;font-size:28px;letter-spacing:0.28em;font-weight:bold;">${safe}</p>
  <p style="margin:0 0 12px;">It expires in 8 minutes and can be used once.</p>
  <p style="margin:0;">If you did not try to sign in, ignore this email.</p>
</body>
</html>`;
}
