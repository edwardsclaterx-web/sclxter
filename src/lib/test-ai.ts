export const TEST_AI_BLOCKED = "ERROR - details need to be filled in";

export function businessReadyForTest(b: {
  name: string;
  websiteUrl: string;
  industry: string;
  contactPhone: string;
  contactEmail: string;
  contactOther: string;
}) {
  const contact = [b.contactPhone, b.contactEmail, b.contactOther].some(
    (v) => (v || "").trim().length > 0,
  );
  return Boolean(
    (b.name || "").trim() &&
      (b.websiteUrl || "").trim() &&
      (b.industry || "").trim() &&
      contact,
  );
}
