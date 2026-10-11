export const WARN_BEFORE_MS = 3 * 24 * 60 * 60 * 1000;

export function remainingMs(
  paidUntil?: string | null,
  now = Date.now(),
): number {
  if (!paidUntil) return 0;
  const t = Date.parse(paidUntil);
  if (!Number.isFinite(t)) return 0;
  return t - now;
}

export function inRenewWarningWindow(
  paidUntil?: string | null,
  now = Date.now(),
): boolean {
  const left = remainingMs(paidUntil, now);
  return left > 0 && left <= WARN_BEFORE_MS;
}

export function formatHadSclxter(
  createdAt?: string | null,
  now = Date.now(),
): string {
  const start = createdAt ? Date.parse(createdAt) : NaN;
  if (!Number.isFinite(start) || start > now) return "0 days";
  const from = new Date(start);
  const to = new Date(now);
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  let days = to.getUTCDate() - from.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0));
    days += prev.getUTCDate();
  }
  if (months < 0) return "0 days";
  const bits: string[] = [];
  if (months > 0) bits.push(months === 1 ? "1 month" : `${months} months`);
  if (days > 0 || months === 0) {
    bits.push(days === 1 ? "1 day" : `${days} days`);
  }
  return bits.join(" ");
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0 seconds";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(days === 1 ? "1 day" : `${days} days`);
  if (hours > 0) parts.push(hours === 1 ? "1 hour" : `${hours} hours`);
  if (days === 0 && minutes > 0) {
    parts.push(minutes === 1 ? "1 minute" : `${minutes} minutes`);
  }
  if (days === 0 && hours === 0) {
    parts.push(seconds === 1 ? "1 second" : `${seconds} seconds`);
  }
  return parts.join(" ");
}
