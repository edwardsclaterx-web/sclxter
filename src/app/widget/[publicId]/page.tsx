import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { readStore } from "@/lib/store";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const data = await readStore();
  const business = data.businesses.find((b) => b.publicId === publicId);
  if (!business) notFound();

  return (
    <div className="flex h-dvh flex-col bg-bg p-4">
      <p className="mb-3 text-xs tracking-[0.2em]">{business.name || "SCLXTER"}</p>
      <div className="min-h-0 flex-1">
        <ChatPanel
          endpoint={`/api/chat?publicId=${encodeURIComponent(publicId)}`}
          welcome={business.appearance.welcome}
          assistantName={business.appearance.assistantName}
          compact
        />
      </div>
    </div>
  );
}
