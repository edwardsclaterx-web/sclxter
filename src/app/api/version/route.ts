import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sha =
    process.env["VERCEL_GIT_COMMIT_SHA"] ||
    process.env["SOURCE_VERSION"] ||
    null;
  return NextResponse.json({ sha });
}
