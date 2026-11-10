export const SETUP_PENCE = 10000;
export const MONTH_PENCE = 7499;

export function setupFeeDue(setupPaid?: boolean) {
  return setupPaid !== true;
}

export type CoverLine = {
  name: string;
  unit_amount: number;
  quantity: number;
};

export const STRIPE_PERCENT_OFF = 99;

export function discountPence(amount: number, percentOff?: number) {
  const n = Math.floor(Number(percentOff) || 0);
  if (n < 1) return amount;
  const kept = 100 - Math.min(99, n);
  return Math.max(1, Math.round((amount * kept) / 100));
}

export function coverCheckoutLines(
  setupPaid: boolean | undefined,
  months: number,
  percentOff?: number,
): { includeSetup: boolean; items: CoverLine[] } {
  const includeSetup = setupFeeDue(setupPaid);
  const items: CoverLine[] = [];
  if (includeSetup) {
    items.push({
      name: "SCLXTER setup",
      unit_amount: discountPence(SETUP_PENCE, percentOff),
      quantity: 1,
    });
  }
  items.push({
    name: "SCLXTER monthly cover",
    unit_amount: discountPence(MONTH_PENCE, percentOff),
    quantity: months,
  });
  return { includeSetup, items };
}
