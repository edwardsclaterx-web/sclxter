"use client";

import Script from "next/script";
import { DEMO_PUBLIC_ID } from "@/lib/seed";

export function WidgetLoader() {
  return (
    <Script
      src="/embed.js"
      data-id={DEMO_PUBLIC_ID}
      strategy="afterInteractive"
    />
  );
}
