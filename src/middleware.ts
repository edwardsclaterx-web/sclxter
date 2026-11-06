import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HEX = /^#[0-9a-fA-F]{6}$/;

function hex(v: string | null) {
  return v && HEX.test(v) ? v : "";
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/widget/")) {
    return NextResponse.next();
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sclxter-widget", "1");
  const q = request.nextUrl.searchParams;
  const outline = hex(q.get("outline"));
  const primary = hex(q.get("primary"));
  const text = hex(q.get("text"));
  if (outline && primary && text) {
    requestHeaders.set("x-sclxter-theme-outline", outline);
    requestHeaders.set("x-sclxter-theme-primary", primary);
    requestHeaders.set("x-sclxter-theme-text", text);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: "/widget/:path*",
};
