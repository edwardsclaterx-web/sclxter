export const SETUP_PENCE = 29999;
export const MONTH_PENCE = 7499;

export function setupFeeDue(setupPaid?: boolean) {
  return setupPaid !== true;
}

export type CoverLine = {
  name: string;
  unit_amount: number;
  quantity: number;
};

export function coverCheckoutLines(
  setupPaid: boolean | undefined,
  months: number,
): { includeSetup: boolean; items: CoverLine[] } {
  const includeSetup = setupFeeDue(setupPaid);
  const items: CoverLine[] = [];
  if (includeSetup) {
    items.push({
      name: "SCLXTER setup",
      unit_amount: SETUP_PENCE,
      quantity: 1,
    });
  }
  items.push({
    name: "SCLXTER monthly cover",
    unit_amount: MONTH_PENCE,
    quantity: months,
  });
  return { includeSetup, items };
}
