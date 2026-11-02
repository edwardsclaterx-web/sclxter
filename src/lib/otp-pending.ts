import "server-only";

import { getPendingOtpUserId } from "./auth";
import { maskDest, otpDestination } from "./otp";
import { readStore } from "./store";

export async function pendingOtpHint() {
  const userId = await getPendingOtpUserId();
  if (!userId) return null;
  const data = await readStore();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return null;
  const row = (data.otpChallenges ?? []).find((o) => o.userId === userId);
  return { dest: maskDest(row?.dest || otpDestination(user)) };
}
