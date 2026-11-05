import { ProductNav, Wordmark } from "@/components/chrome";

export function DashHeader({
  admin,
  purchaser,
}: {
  admin: boolean;
  purchaser?: boolean;
}) {
  return (
    <header
      className="site-bar sticky top-0 z-50 flex min-w-0 max-w-full shrink-0 items-center justify-between gap-3 border-b border-line bg-bg px-5 py-4 md:px-10"
      style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "var(--bg)" }}
    >
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
