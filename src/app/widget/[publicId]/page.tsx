import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isDemoBusiness } from "@/lib/access";
import { businessHasLiveAccess } from "@/lib/billing";
import {
  EMBED_OFF_SITE,
  embedPageAllowed,
  parsePageOrigin,
} from "@/lib/embed-host";
import { SCLXTER_SITE_ID } from "@/lib/groq";
import { readStore } from "@/lib/store";
import { normalizeTheme } from "@/lib/widget-theme";
import { WidgetForm } from "./widget-form";

export const dynamic = "force-dynamic";

function WidgetShell({
  children,
  background,
  outline,
  color,
}: {
  children: React.ReactNode;
  background: string;
  outline: string;
  color?: string;
}) {
  return (
    <div className="box-border h-dvh bg-transparent p-[6px]">
      <div
        className="flex h-full min-h-0 flex-col overflow-visible"
        style={{
          background,
          color,
          border: `3px solid ${outline}`,
          borderRadius: 24,
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function Unavailable({ text }: { text: string }) {
  return (
    <WidgetShell background="#050505" outline="#222222">
      <div className="flex h-full items-center justify-center text-center text-sm text-muted">
        {text}
      </div>
    </WidgetShell>
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
  searchParams: Promise<{
    from?: string;
    outline?: string;
    primary?: string;
    text?: string;
  }>;
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
      <WidgetShell background="#050505" outline="#222222">
        <div className="min-h-0 flex-1">
          <WidgetForm
            publicId={SCLXTER_SITE_ID}
            welcome="Ask about sclxter, pricing, or the demo."
            assistantName="sclxter"
            from={from || origin}
          />
        </div>
      </WidgetShell>
    );
  }

  const data = await readStore();
  const business = data.businesses.find((b) => b.publicId === publicId);
  if (!business) notFound();
  if (!businessHasLiveAccess(business, data)) {
    return <div className="h-dvh bg-transparent" />;
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
  const welcome =
    business.appearance?.welcome || "Ask about hours, prices, or how to book.";
  const assistantName = business.appearance?.assistantName || "Assistant";

  return (
    <WidgetShell
      background={theme.primary}
      outline={theme.outline}
      color={theme.text}
    >
      <div className="min-h-0 flex-1">
        <WidgetForm
          publicId={publicId}
          welcome={welcome}
          assistantName={assistantName}
          theme={theme}
          from={from}
        />
      </div>
    </WidgetShell>
  );
}
