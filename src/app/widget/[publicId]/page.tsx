import { notFound } from "next/navigation";
import { readStore } from "@/lib/store";
import { WidgetForm } from "./widget-form";

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
      <div className="min-h-0 flex-1">
        <WidgetForm
          publicId={publicId}
          welcome={business.appearance.welcome}
          assistantName={business.appearance.assistantName}
        />
      </div>
    </div>
  );
}
