import Link from "next/link";

export function PurchaseSuccess({
  email,
  businessName,
  months,
  paidUntil,
}: {
  email: string;
  businessName?: string | null;
  months: number;
  paidUntil: string | null;
}) {
  const n = Math.max(1, Math.floor(months) || 1);
  const until = paidUntil
    ? new Date(paidUntil).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const shop = (businessName || "").trim();

  return (
    <section className="mt-10">
      <h1 className="text-2xl font-medium tracking-tight">
        Successfully bought for:
      </h1>
      <p className="mt-6 text-base leading-7 text-fg">{email}</p>
      {shop ? (
        <p className="mt-2 text-base leading-7 text-fg">{shop}</p>
      ) : null}
      <p className="mt-6 text-sm leading-7 text-muted">
        {n === 1 ? "1 month of cover" : `${n} months of cover`}
        {until ? `, until ${until}` : ""}
      </p>
      <Link
        href="/dashboard"
        className="mt-10 inline-flex h-10 w-full items-center justify-center bg-accent px-4 text-sm text-accent-fg sm:w-auto"
      >
        Go to My dashboard
      </Link>
    </section>
  );
}
