import { notFound } from "next/navigation";
import { SCLXTER_SITE_ID } from "@/lib/groq";
import { readStore } from "@/lib/store";
import { normalizeTheme } from "@/lib/widget-theme";
import { WidgetForm } from "./widget-form";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  if (publicId === SCLXTER_SITE_ID) {
    return (
      <div className="flex h-dvh flex-col bg-bg p-4">
        <div className="min-h-0 flex-1">
          <WidgetForm
            publicId={SCLXTER_SITE_ID}
            welcome="Ask about sclxter, pricing, or the demo."
            assistantName="sclxter"
          />
        </div>
      </div>
    );
  }
  const data = await readStore();
  const business = data.businesses.find((b) => b.publicId === publicId);
  if (!business) notFound();
  const theme = normalizeTheme(business.appearance?.theme);

  return (
    <div
      className="flex h-dvh flex-col p-4"
      style={{ background: theme.primary, color: theme.text }}
    >
      <div className="min-h-0 flex-1">
        <WidgetForm
          publicId={publicId}
          welcome={business.appearance.welcome}
          assistantName={business.appearance.assistantName}
          theme={theme}
        />
      </div>
    </div>
  );
}
