import { ProductNav, Wordmark } from "@/components/chrome";

export function DashHeader({
  admin,
  purchaser,
}: {
  admin: boolean;
  purchaser?: boolean;
}) {
  return (
    <header className="flex min-w-0 max-w-full items-center justify-between gap-3 overflow-x-auto border-b border-line px-5 py-4 md:px-10">
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
