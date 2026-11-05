import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { unreadContactCount } from "@/lib/support";
import { readStore } from "@/lib/store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    const res = NextResponse.json({ count: 0 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  const data = await readStore();
  const res = NextResponse.json({ count: unreadContactCount(user, data) });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
