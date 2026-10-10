import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/store";
import { normalizeTheme } from "@/lib/widget-theme";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await ctx.params;
  const data = await readStore();
  const business = data.businesses.find((b) => b.publicId === publicId);
  if (!business) {
    return cors(NextResponse.json({ error: "Unknown widget." }, { status: 404 }));
  }
  await updateStore((store) => {
    const row = store.businesses.find((b) => b.publicId === publicId);
    if (row && !row.widgetConnectedAt) {
      row.widgetConnectedAt = new Date().toISOString();
    }
  });
  return cors(
    NextResponse.json({
      publicId: business.publicId,
      name: business.name,
      appearance: {
        ...business.appearance,
        theme: normalizeTheme(business.appearance?.theme),
      },
      theme: normalizeTheme(business.appearance?.theme),
    }),
  );
}
