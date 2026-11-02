import "server-only";

import { getPendingOtp } from "./auth";
import { maskDest } from "./otp";

export async function pendingOtpHint() {
  const pending = await getPendingOtp();
  if (!pending) return null;
  return { dest: maskDest(pending.dest) };
}
