import { ProductNav, Wordmark } from "@/components/chrome";

export function DashHeader({
  admin,
  purchaser,
}: {
  admin: boolean;
  purchaser?: boolean;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-10">
      <Wordmark href="/" />
      <ProductNav
        signedIn
        admin={admin}
        purchaser={purchaser}
        showPricing={false}
      />
    </header>
  );
}
