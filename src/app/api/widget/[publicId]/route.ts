import { NextResponse } from "next/server";
import { corsAllow, publicEmbedGate, readEmbedFrom } from "@/lib/embed-host";
import { readStore } from "@/lib/store";
import { normalizeTheme } from "@/lib/widget-theme";

function cors(res: NextResponse, origin?: string | null) {
  return corsAllow(res, origin);
}

export async function OPTIONS(request: Request) {
  return cors(new NextResponse(null, { status: 204 }), request.headers.get("origin"));
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await ctx.params;
  const pageOrigin = readEmbedFrom(request);
  const data = await readStore();
  const business = data.businesses.find((b) => b.publicId === publicId);
  if (!business) {
    return cors(
      NextResponse.json({ live: false, error: "Unknown widget." }, { status: 404 }),
      pageOrigin,
    );
  }
  const gate = publicEmbedGate(request, business, data, pageOrigin);
  if (!gate.ok) {
    return cors(
      NextResponse.json({ live: false, error: gate.error }, { status: gate.status }),
      pageOrigin,
    );
  }
  const res = NextResponse.json({
    live: true,
    publicId: business.publicId,
    name: business.name,
    appearance: {
      ...business.appearance,
      theme: normalizeTheme(business.appearance?.theme),
    },
    theme: normalizeTheme(business.appearance?.theme),
  });
  res.headers.set("Cache-Control", "no-store");
  return cors(res, pageOrigin);
}
