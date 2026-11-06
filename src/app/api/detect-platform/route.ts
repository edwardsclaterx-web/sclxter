import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requireActiveUser } from "@/lib/require-active";
import { resolveBusiness } from "@/lib/access";
import {
  detectSitePlatform,
  PLATFORM_LABEL,
  resolveDetectUrl,
} from "@/lib/detect-platform";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  const user = requireActiveUser(await getSessionUser());
  if (user instanceof NextResponse) return user;
  const body = (await request.json().catch(() => ({}))) as {
    seq?: number;
    url?: string;
  };
  const seq = typeof body.seq === "number" ? body.seq : null;
  const biz = await resolveBusiness(user, seq);
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const origin = new URL(request.url).origin;
  const pasted = typeof body.url === "string" ? body.url.trim() : "";
  const start = resolveDetectUrl(pasted || biz.websiteUrl, origin);
  if (!start) {
    return NextResponse.json({
      platform: null,
      label: null,
      checkedUrl: null,
      savedUrl: Boolean(biz.websiteUrl.trim()),
    });
  }

  const result = await detectSitePlatform(start);
  return NextResponse.json({
    platform: result.platform,
    label: result.platform ? PLATFORM_LABEL[result.platform] : null,
    checkedUrl: result.checkedUrl,
    savedUrl: Boolean(biz.websiteUrl.trim()),
  });
}
