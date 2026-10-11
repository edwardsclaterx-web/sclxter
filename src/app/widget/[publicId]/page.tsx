import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isDemoBusiness } from "@/lib/access";
import { businessHasLiveAccess } from "@/lib/billing";
import {
  EMBED_OFF_SITE,
  EMBED_UNAVAILABLE,
  embedPageAllowed,
  parsePageOrigin,
} from "@/lib/embed-host";
import { SCLXTER_SITE_ID } from "@/lib/groq";
import { readStore } from "@/lib/store";
import { normalizeTheme } from "@/lib/widget-theme";
import { WidgetForm } from "./widget-form";

function Unavailable({ text }: { text: string }) {
  return (
    <div className="flex h-dvh items-center justify-center bg-bg p-4 text-center text-sm text-muted">
      {text}
    </div>
  );
}

async function appOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { publicId } = await params;
  const q = await searchParams;
  const from = parsePageOrigin(q.from ?? null);
  const origin = await appOrigin();

  if (publicId === SCLXTER_SITE_ID) {
    if (from && from !== origin) {
      return <Unavailable text={EMBED_OFF_SITE} />;
    }
    return (
      <div className="flex h-dvh flex-col bg-bg p-4">
        <div className="min-h-0 flex-1">
          <WidgetForm
            publicId={SCLXTER_SITE_ID}
            welcome="Ask about sclxter, pricing, or the demo."
            assistantName="sclxter"
            from={from || origin}
          />
        </div>
      </div>
    );
  }

  const data = await readStore();
  const business = data.businesses.find((b) => b.publicId === publicId);
  if (!business) notFound();
  if (!businessHasLiveAccess(business, data)) {
    return <Unavailable text={EMBED_UNAVAILABLE} />;
  }
  if (
    !embedPageAllowed({
      publicId: business.publicId,
      websiteUrl: business.websiteUrl,
      pageOrigin: from,
      appOrigin: origin,
      demo: isDemoBusiness(business),
    })
  ) {
    return <Unavailable text={EMBED_OFF_SITE} />;
  }

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
          from={from}
        />
      </div>
    </div>
  );
}
